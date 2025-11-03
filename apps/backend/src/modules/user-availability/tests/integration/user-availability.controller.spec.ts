import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UserAvailability } from '../../entities/user-availability.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { UserAvailabilityModule } from '../../user-availability.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { UserAvailabilityObjectMother } from 'src/common/tests/object-mothers/user-availability-object-mother';
import { IAuthService } from 'src/modules/auth/auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { UserAvailabilityBuilder } from 'src/common/tests/builders/user-availability.builder';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

describe('UserAvailabilityController (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: IAuthService;

  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let availabilityRepo: Repository<UserAvailability>;

  let user: User;
  let course: Course;
  let availability: UserAvailability;
  let token: string;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

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
          UserAvailability,
        ]),
        AuthModule,
        UserAvailabilityModule,
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
    availabilityRepo = dataSource.getRepository(UserAvailability);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await app.close();
  });

  beforeEach(async () => {
    // Создаём пользователя через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);
    const { accessToken } = authService.createTokenPair(user);
    token = `Bearer ${accessToken}`;

    // Создаём курс через билдер
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    // Создаём доступность через билдер
    const availabilityData = new UserAvailabilityBuilder()
      .withUserId(user.id)
      .withCourseId(course.id)
      .build();
    availability = await availabilityRepo.save(
      availabilityRepo.create(availabilityData as UserAvailability),
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_availability", "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  it('POST /user-availability → должен создать доступность', async () => {
    const dto = UserAvailabilityObjectMother.buildCreateDto({
      course_id: course.id,
    });

    const res = await request(app.getHttpServer())
      .post('/user-availability')
      .set('Authorization', token)
      .send(dto)
      .expect(201);

    expect(res.body.course_id).toBe(dto.course_id);
    expect(res.body.week_day).toBe(dto.week_day);
    expect(res.body.start_time).toBe(dto.start_time);
    expect(res.body.end_time).toBe(dto.end_time);
    expect(res.body.id).toBeDefined();
  });

  it('POST /user-availability → должен вернуть ошибку при создании с невалидным week_day', async () => {
    const dto = UserAvailabilityObjectMother.buildCreateDto({
      course_id: course.id,
      week_day: 10, // Невалидное значение (должно быть 0-6)
    });

    await request(app.getHttpServer())
      .post('/user-availability')
      .set('Authorization', token)
      .send(dto)
      .expect(400);
  });

  // ---------- FIND ALL ----------
  it('GET /user-availability → должен вернуть все доступности для пользователя', async () => {
    const res = await request(app.getHttpServer())
      .get('/user-availability')
      .query({ course_id: course.id })
      .set('Authorization', token)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('GET /user-availability → должен вернуть пустой массив если доступностей нет', async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_availability" RESTART IDENTITY CASCADE`,
    );

    const res = await request(app.getHttpServer())
      .get('/user-availability')
      .query({ course_id: course.id })
      .set('Authorization', token)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  // ---------- FIND BY ID ----------
  it('GET /user-availability/:id → должен вернуть доступность по id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/user-availability/${availability.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(res.body.id).toBe(availability.id);
    expect(res.body.week_day).toBe(availability.week_day);
  });

  it('GET /user-availability/:id → должен вернуть 404 для несуществующей доступности', async () => {
    await request(app.getHttpServer())
      .get(`/user-availability/${uuidv4()}`)
      .set('Authorization', token)
      .expect(404);
  });

  // ---------- UPDATE ----------
  it('PATCH /user-availability/:id → должен обновить доступность', async () => {
    const dto = UserAvailabilityObjectMother.buildUpdateDto({
      start_time: '10:00',
      end_time: '18:00',
    });

    const res = await request(app.getHttpServer())
      .patch(`/user-availability/${availability.id}`)
      .set('Authorization', token)
      .send(dto)
      .expect(200);

    expect(res.body.start_time).toBe(dto.start_time);
    expect(res.body.end_time).toBe(dto.end_time);
  });

  it('PATCH /user-availability/:id → должен вернуть 404 при обновлении несуществующей доступности', async () => {
    const dto = UserAvailabilityObjectMother.buildUpdateDto();

    await request(app.getHttpServer())
      .patch(`/user-availability/${uuidv4()}`)
      .set('Authorization', token)
      .send(dto)
      .expect(404);
  });

  // ---------- DELETE ----------
  it('DELETE /user-availability/:id → должен удалить доступность', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/user-availability/${availability.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(res.body.id).toBe(availability.id);
  });

  it('DELETE /user-availability/:id → должен вернуть 404 для несуществующей доступности', async () => {
    await request(app.getHttpServer())
      .delete(`/user-availability/${uuidv4()}`)
      .set('Authorization', token)
      .expect(404);
  });
});
