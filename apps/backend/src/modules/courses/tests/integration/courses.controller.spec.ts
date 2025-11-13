import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CoursesController } from '../../courses.controller';
import { Course } from '../../entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingDataSourceOptions,
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { CoursesService, ICoursesService } from '../../courses.service';
import { CoursesModule } from '../../courses.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { CourseObjectMother } from 'src/common/tests/object-mothers/course-object-mother';
import { IAuthService } from 'src/modules/auth/auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

describe('CoursesController (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: IAuthService;

  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;

  let user: User;
  let course: Course;
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
        CoursesModule,
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
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  it('POST /courses → should create a course', async () => {
    const dto = CourseObjectMother.buildCreateDto();

    const res = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', token)
      .send(dto)
      .expect(201);

    expect(res.body).toMatchObject(dto);
    expect(res.body.id).toBeDefined();
  });

  it('POST /courses → should fail to create course with empty name', async () => {
    const dto = CourseObjectMother.buildCreateDto({ name: '' });

    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', token)
      .send(dto)
      .expect(400);
  });

  // ---------- FIND ALL ----------
  it('GET /courses → should return all courses', async () => {
    const res = await request(app.getHttpServer()).get('/courses').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('GET /courses → should return empty array if no courses exist', async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."course" RESTART IDENTITY CASCADE`,
    );
    const res = await request(app.getHttpServer()).get('/courses').expect(200);
    expect(res.body).toEqual([]);
  });

  //   // ---------- FIND BY ID ----------
  it('GET /courses/:id → should return one course', async () => {
    const res = await request(app.getHttpServer())
      .get(`/courses/${course.id}`)
      .expect(200);

    expect(res.body.id).toBe(course.id);
    expect(res.body.name).toBe(course.name);
  });

  it('GET /courses/:id → should return 404 for non-existing course', async () => {
    await request(app.getHttpServer()).get(`/courses/${uuidv4()}`).expect(404);
  });

  // ---------- UPDATE ----------
  it('PATCH /courses/:id → should update course', async () => {
    const dto = CourseObjectMother.buildUpdateDto({ name: 'New name' });

    const res = await request(app.getHttpServer())
      .patch(`/courses/${course.id}`)
      .set('Authorization', token)
      .send(dto)
      .expect(200);

    expect(res.body.name).toBe(dto.name);
  });

  it('PATCH /courses/:id → should return 404 when updating non-existing course', async () => {
    const dto = CourseObjectMother.buildUpdateDto({ name: 'New name' });

    await request(app.getHttpServer())
      .patch(`/courses/${uuidv4()}`)
      .set('Authorization', token)
      .send(dto)
      .expect(404);
  });

  // ---------- DELETE ----------
  it('DELETE /courses/:id → should delete course', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/courses/${course.id}`)
      .set('Authorization', token)
      .expect(200);
    expect(res.body.id).toBe(course.id);
  });

  it('DELETE /courses/:id → should return 404 for non-existing course', async () => {
    await request(app.getHttpServer())
      .delete(`/courses/${uuidv4()}`)
      .set('Authorization', token)
      .expect(404);
  });
});
