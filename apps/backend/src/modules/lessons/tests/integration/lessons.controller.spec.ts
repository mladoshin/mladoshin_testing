import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CourseLesson } from '../../entities/course-lesson.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { LessonsModule } from '../../lessons.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { CourseLessonObjectMother } from 'src/common/tests/object-mothers/lesson-object-mother';
import { IAuthService } from 'src/modules/auth/auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

describe('LessonsController (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: IAuthService;

  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let lessonRepo: Repository<CourseLesson>;

  let user: User;
  let course: Course;
  let lesson: CourseLesson;
  let token: string;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    // Основной модуль с указанием схемы
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (
            configService: ConfigService,
          ): Promise<TypeOrmModuleOptions> => {
            const config = getTestingDatabaseConfig(configService);
            await createTestingSchema(configService, schemaName);
            return { ...config, schema: schemaName };
          },
        }),
        TypeOrmModule.forFeature([
          User,
          UserProfile,
          Payment,
          Course,
          CourseLesson,
        ]),
        AuthModule,
        LessonsModule,
        AppLoggerModule,
      ],
      providers: [ErrorLoggerInterceptor],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    const errorLoggerInterceptor = app.get(ErrorLoggerInterceptor);
    app.useGlobalInterceptors(errorLoggerInterceptor);
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
    authService = module.get<IAuthService>('IAuthService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
    courseRepo = dataSource.getRepository(Course);
    lessonRepo = dataSource.getRepository(CourseLesson);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await app.close();
  });

  beforeEach(async () => {
    // Создаём объекты через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);
    const { accessToken } = authService.createTokenPair(user);
    token = `Bearer ${accessToken}`;

    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    const lessonData = new CourseLessonBuilder()
      .withTitle('Test Lesson')
      .withCourseId(course.id)
      .build();
    lesson = await lessonRepo.save(lessonData);
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  it('POST /lessons → should create a lesson', async () => {
    const dto = CourseLessonObjectMother.buildCreateDto({
      course_id: course.id,
    });

    const res = await request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', token)
      .send(dto)
      .expect(201);

    expect(res.body).toMatchObject({
      title: dto.title,
      content: dto.content,
      duration: dto.duration,
      course_id: course.id,
    });
    expect(res.body.id).toBeDefined();
  });

  it('POST /lessons → should fail to create lesson with short title', async () => {
    const dto = CourseLessonObjectMother.buildCreateDto({
      course_id: course.id,
      title: 'abc', // Меньше минимальной длины (4)
    });

    await request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', token)
      .send(dto)
      .expect(400);
  });

  // ---------- FIND ALL ----------
  it('GET /lessons → should return all lessons', async () => {
    const res = await request(app.getHttpServer()).get('/lessons').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('GET /lessons → should return empty array if no lessons exist', async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."course_lesson" RESTART IDENTITY CASCADE`,
    );
    const res = await request(app.getHttpServer()).get('/lessons').expect(200);
    expect(res.body).toEqual([]);
  });

  // ---------- FIND BY ID ----------
  it('GET /lessons/:id → should return one lesson', async () => {
    const res = await request(app.getHttpServer())
      .get(`/lessons/${lesson.id}`)
      .expect(200);

    expect(res.body.id).toBe(lesson.id);
    expect(res.body.title).toBe(lesson.title);
  });

  it('GET /lessons/:id → should return 404 for non-existing lesson', async () => {
    await request(app.getHttpServer()).get(`/lessons/${uuidv4()}`).expect(404);
  });

  // ---------- UPDATE ----------
  it('PATCH /lessons/:id → should update lesson', async () => {
    const dto = CourseLessonObjectMother.buildUpdateDto({
      title: 'Updated Lesson Title',
    });

    const res = await request(app.getHttpServer())
      .patch(`/lessons/${lesson.id}`)
      .set('Authorization', token)
      .send(dto)
      .expect(200);

    expect(res.body.title).toBe(dto.title);
  });

  it('PATCH /lessons/:id → should return 404 when updating non-existing lesson', async () => {
    const dto = CourseLessonObjectMother.buildUpdateDto({
      title: 'Updated Title',
    });

    await request(app.getHttpServer())
      .patch(`/lessons/${uuidv4()}`)
      .set('Authorization', token)
      .send(dto)
      .expect(404);
  });

  // ---------- DELETE ----------
  it('DELETE /lessons/:id → should delete lesson', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/lessons/${lesson.id}`)
      .set('Authorization', token)
      .expect(200);
    expect(res.body.title).toBe(lesson.title);
  });

  it('DELETE /lessons/:id → should return 404 for non-existing lesson', async () => {
    await request(app.getHttpServer())
      .delete(`/lessons/${uuidv4()}`)
      .set('Authorization', token)
      .expect(404);
  });
});
