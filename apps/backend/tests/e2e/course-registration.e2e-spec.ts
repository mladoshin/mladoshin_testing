import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { createTestingSchema, getTestingDatabaseConfig } from 'src/common/utils/utils';

describe('Сценарий регистрации и покупки курса (E2E)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let schemaName: string;

  let courseRepo: Repository<Course>;
  let lessonRepo: Repository<CourseLesson>;

  let course: Course;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }

    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    // Create the testing module with isolated schema
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
          CourseEnrollment,
        ]),
        AuthModule,
        CoursesModule,
        LessonsModule,
        PaymentsModule,
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
    app.setGlobalPrefix('api');
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
    courseRepo = dataSource.getRepository(Course);
    lessonRepo = dataSource.getRepository(CourseLesson);
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await app.close();
  });

  beforeEach(async () => {
    // Create a course with lessons for testing
    const courseData = new CourseBuilder()
      .withName('Introduction to TypeScript')
      .build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    // Create two lessons for the course
    const lesson1Data = new CourseLessonBuilder()
      .withCourseId(course.id)
      .withTitle('TypeScript Basics')
      .withContent('Learn the fundamentals of TypeScript')
      .withDuration(90)
      .build();
    await lessonRepo.save(
      lessonRepo.create(lesson1Data as CourseLesson),
    );

    const lesson2Data = new CourseLessonBuilder()
      .withCourseId(course.id)
      .withTitle('Advanced TypeScript')
      .withContent('Deep dive into advanced TypeScript features')
      .withDuration(120)
      .build();
    await lessonRepo.save(
      lessonRepo.create(lesson2Data as CourseLesson),
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  it('должен завершить полный сценарий регистрации пользователя и покупки курса', async () => {
    // Step 1: Register in system
    const registerDto = AuthObjectMother.buildRegisterDto({
      email: 'student@example.com',
      password: 'SecurePassword123!',
    });

    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerDto)
      .expect(201);

    expect(registerRes.body).toHaveProperty('access_token');
    expect(registerRes.body.access_token).toBeTruthy();
    const accessToken = registerRes.body.access_token;

    // Step 2: Register for course (enroll)
    const enrollRes = await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/register`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(enrollRes.body).toHaveProperty('id');
    expect(enrollRes.body.course_id).toBe(course.id);
    expect(enrollRes.body).toHaveProperty('status');

    // Step 3: Purchase the course
    const payRes = await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/pay`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(payRes.body).toHaveProperty('success');
    expect(payRes.body.success).toBe(true);

    // Step 4: Get the course's lessons
    const lessonsRes = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/lessons`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(lessonsRes.body)).toBe(true);
    expect(lessonsRes.body.length).toBe(2);

    // Verify lesson details
    const lessonTitles = lessonsRes.body.map((l: any) => l.title);
    expect(lessonTitles).toContain('TypeScript Basics');
    expect(lessonTitles).toContain('Advanced TypeScript');

    // Verify lesson structure
    lessonsRes.body.forEach((lesson: any) => {
      expect(lesson).toHaveProperty('id');
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('content');
      expect(lesson).toHaveProperty('duration');
      expect(lesson.course_id).toBe(course.id);
    });
  });

  it('должен вернуть ошибку при регистрации на несуществующий курс', async () => {
    // Register a user first
    const registerDto = AuthObjectMother.buildRegisterDto({
      password: 'SecurePassword123!',
    });

    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerDto)
      .expect(201);

    const accessToken = registerRes.body.access_token;

    // Try to register for a non-existent course
    const nonExistentCourseId = uuidv4();
    await request(app.getHttpServer())
      .post(`/api/courses/${nonExistentCourseId}/register`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('должен запретить доступ к урокам без аутентификации', async () => {
    await request(app.getHttpServer())
      .get(`/api/courses/${course.id}/lessons`)
      .expect(403);
  });

  it('должен запретить покупку курса без предварительной регистрации на него', async () => {
    // Register a user but do not enroll in the course
    const registerDto = AuthObjectMother.buildRegisterDto({
      password: 'SecurePassword123!',
    });

    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerDto)
      .expect(201);

    const accessToken = registerRes.body.access_token;

    // Try to purchase without enrolling first
    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/pay`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('должен разрешить просмотр деталей курса до регистрации', async () => {
    // Courses can be viewed without authentication (OptionalAuthGuard)
    const courseRes = await request(app.getHttpServer())
      .get(`/api/courses/${course.id}`)
      .expect(200);

    expect(courseRes.body.id).toBe(course.id);
    expect(courseRes.body.name).toBe('Introduction to TypeScript');
  });
});
