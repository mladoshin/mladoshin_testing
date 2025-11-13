import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { UserScheduleModule } from '../../user-schedule.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { UserSchedule } from '../../entities/user-schedule.entity';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { IAuthService } from 'src/modules/auth/auth.service';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

describe('UserScheduleController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: IAuthService;
  let user: User;
  let course: Course;
  let lesson: CourseLesson;
  let schedule: UserSchedule;
  let token: string;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
        UserScheduleModule,
        CoursesModule,
        LessonsModule,
        AuthModule,
        AppLoggerModule,
      ],
      providers: [ErrorLoggerInterceptor],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const errorLoggerInterceptor = app.get(ErrorLoggerInterceptor);
    app.useGlobalInterceptors(errorLoggerInterceptor);

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    authService = moduleFixture.get<IAuthService>('IAuthService');
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Создаём пользователя
    const userRepo = dataSource.getRepository(User);
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    // Генерируем JWT токен
    const { accessToken } = authService.createTokenPair(user);
    token = `Bearer ${accessToken}`;

    // Создаём курс
    const courseRepo = dataSource.getRepository(Course);
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    // Создаём урок
    const lessonRepo = dataSource.getRepository(CourseLesson);
    const lessonData = new CourseLessonBuilder()
      .withCourseId(course.id)
      .withTitle('Test Lesson')
      .build();
    lesson = await lessonRepo.save(
      lessonRepo.create(lessonData as CourseLesson),
    );

    // Создаём расписание
    const scheduleRepo = dataSource.getRepository(UserSchedule);
    schedule = await scheduleRepo.save(
      scheduleRepo.create({
        user_id: user.id,
        course_id: course.id,
        lesson_id: lesson.id,
        duration: 60,
        start_time: '09:00',
        end_time: '10:00',
        scheduled_date: '2025-01-15',
      }),
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_schedule", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  describe('POST /user-schedule', () => {
    it('должен создать расписание', async () => {
      const dto = {
        data: [
          {
            course_id: course.id,
            lesson_id: lesson.id,
            duration: 90,
            start_time: '14:00',
            end_time: '15:30',
            scheduled_date: '2025-01-20',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/user-schedule')
        .set('Authorization', token)
        .send(dto)
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].course_id).toBe(course.id);
      expect(res.body[0].lesson_id).toBe(lesson.id);
      expect(res.body[0].duration).toBe(90);
    });

    it('должен вернуть ошибку при невалидных данных', async () => {
      const dto = {
        data: [
          {
            course_id: course.id,
            lesson_id: lesson.id,
            duration: -5, // Невалидная продолжительность
            start_time: '14:00',
            end_time: '15:30',
            scheduled_date: '2025-01-20',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/user-schedule')
        .set('Authorization', token)
        .send(dto)
        .expect(400);
    });
  });

  // ---------- GENERATE ----------
  describe('POST /user-schedule/generate', () => {
    //   it('должен сгенерировать расписание', async () => {
    //     // Для генерации нужны данные: enrollment, availability, lessons
    //     // Это более сложный кейс, для позитивного теста упростим проверку
    //     const dto = {
    //       course_id: course.id,
    //     };

    //     // Метод может вернуть null или пустой массив если нет доступных слотов
    //     const res = await request(app.getHttpServer())
    //       .post('/user-schedule/generate')
    //       .set('Authorization', token)
    //       .send(dto);

    //     // Проверяем что возвращает 201 и корректный формат
    //     expect([200, 201]).toContain(res.status);
    //     expect(res.body === null || Array.isArray(res.body)).toBe(true);
    //   });

    it('должен вернуть 404 для несуществующего курса', async () => {
      const dto = {
        course_id: uuidv4(),
      };

      await request(app.getHttpServer())
        .post('/user-schedule/generate')
        .set('Authorization', token)
        .send(dto)
        .expect(404);
    });
  });

  // ---------- GET ----------
  describe('GET /user-schedule', () => {
    it('должен вернуть расписание пользователя', async () => {
      const res = await request(app.getHttpServer())
        .get('/user-schedule')
        .query({ course_id: course.id })
        .set('Authorization', token)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].course_id).toBe(course.id);
    });

    it('должен вернуть 404 для несуществующего курса', async () => {
      await request(app.getHttpServer())
        .get('/user-schedule')
        .query({ course_id: uuidv4() })
        .set('Authorization', token)
        .expect(404);
    });
  });

  // ---------- DELETE ----------
  describe('DELETE /user-schedule', () => {
    it('должен удалить расписание пользователя', async () => {
      const res = await request(app.getHttpServer())
        .delete('/user-schedule')
        .query({ course_id: course.id })
        .set('Authorization', token)
        .expect(200);

      expect(res.body).toHaveProperty('success');
      expect(res.body.success).toBe(true);
    });

    it('должен вернуть 404 для несуществующего курса', async () => {
      await request(app.getHttpServer())
        .delete('/user-schedule')
        .query({ course_id: uuidv4() })
        .set('Authorization', token)
        .expect(404);
    });
  });
});
