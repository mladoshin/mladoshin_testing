import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PaymentsController } from '../../payments.controller';
import { Payment } from '../../entities/payment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { PaymentsModule } from '../../payments.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { PaymentObjectMother } from 'src/common/tests/object-mothers/payment-object-mother';
import { IAuthService } from 'src/modules/auth/auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { PaymentBuilder } from 'src/common/tests/builders/payment.builder';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

describe('PaymentsController (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: IAuthService;

  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let paymentRepo: Repository<Payment>;

  let user: User;
  let course: Course;
  let payment: Payment;
  let token: string;
  let schemaName: string;

  beforeAll(async () => {
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
        ]),
        AuthModule,
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
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
    authService = module.get<IAuthService>('IAuthService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
    courseRepo = dataSource.getRepository(Course);
    paymentRepo = dataSource.getRepository(Payment);
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

    // Создаём платеж через билдер
    const paymentData = new PaymentBuilder()
      .withUserId(user.id)
      .withCourseId(course.id)
      .build();
    payment = await paymentRepo.save(paymentRepo.create(paymentData as Payment));
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  it('POST /payments → должен создать платеж', async () => {
    const dto = PaymentObjectMother.buildCreateDto({
      userId: user.id,
      courseId: course.id,
    });

    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', token)
      .send(dto)
      .expect(201);

    expect(res.body.amount).toBe(dto.amount);
    expect(res.body.user_id).toBe(user.id);
    expect(res.body.course_id).toBe(course.id);
    expect(res.body.id).toBeDefined();
  });

  it('POST /payments → должен вернуть ошибку при создании платежа с отрицательной суммой', async () => {
    const dto = PaymentObjectMother.buildCreateDto({
      userId: user.id,
      courseId: course.id,
      amount: -100,
    });

    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', token)
      .send(dto)
      .expect(400);
  });

  // ---------- FIND ALL ----------
  it('GET /payments → должен вернуть все платежи', async () => {
    const res = await request(app.getHttpServer())
      .get('/payments')
      .set('Authorization', token)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('GET /payments → должен вернуть пустой массив если платежей нет', async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment" RESTART IDENTITY CASCADE`,
    );

    const res = await request(app.getHttpServer())
      .get('/payments')
      .set('Authorization', token)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  // ---------- FIND BY ID ----------
  it('GET /payments/:id → должен вернуть платеж по id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/payments/${payment.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(res.body.id).toBe(payment.id);
    expect(res.body.amount).toBe(payment.amount);
  });

  it('GET /payments/:id → должен вернуть 404 для несуществующего платежа', async () => {
    await request(app.getHttpServer())
      .get(`/payments/${uuidv4()}`)
      .set('Authorization', token)
      .expect(404);
  });

  // ---------- UPDATE ----------
  it('PATCH /payments/:id → должен обновить платеж', async () => {
    const dto = PaymentObjectMother.buildUpdateDto({ amount: 200 });

    const res = await request(app.getHttpServer())
      .patch(`/payments/${payment.id}`)
      .set('Authorization', token)
      .send(dto)
      .expect(200);

    expect(res.body.amount).toBe(dto.amount);
  });

  it('PATCH /payments/:id → должен вернуть 404 при обновлении несуществующего платежа', async () => {
    const dto = PaymentObjectMother.buildUpdateDto({ amount: 200 });

    await request(app.getHttpServer())
      .patch(`/payments/${uuidv4()}`)
      .set('Authorization', token)
      .send(dto)
      .expect(404);
  });

  // ---------- DELETE ----------
  it('DELETE /payments/:id → должен удалить платеж', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/payments/${payment.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(res.body.id).toBe(payment.id);
  });

  it('DELETE /payments/:id → должен вернуть 404 для несуществующего платежа', async () => {
    await request(app.getHttpServer())
      .delete(`/payments/${uuidv4()}`)
      .set('Authorization', token)
      .expect(404);
  });
});
