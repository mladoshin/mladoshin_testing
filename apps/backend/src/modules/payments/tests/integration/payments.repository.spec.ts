import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { PaymentRepo } from '../../payments.repository';
import { UpdatePaymentDto } from '../../dto/update-payment.dto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { v4 as uuidv4 } from 'uuid';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { PaymentBuilder } from 'src/common/tests/builders/payment.builder';
import { PaymentObjectMother } from 'src/common/tests/object-mothers/payment-object-mother';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';

describe('PaymentRepo (integration)', () => {
  let module: TestingModule;
  let paymentRepo: PaymentRepo;
  let dataSource: DataSource;
  let user: User;
  let course: Course;
  let payment: Payment;
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
          load: [],
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
      ],
      providers: [PaymentRepo],
    }).compile();

    paymentRepo = module.get<PaymentRepo>(PaymentRepo);
    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    const userRepo = dataSource.getRepository(User);
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    const courseRepo = dataSource.getRepository(Course);
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    const paymentRepo = dataSource.getRepository(Payment);
    const paymentData = new PaymentBuilder()
      .withUserId(user.id)
      .withCourseId(course.id)
      .build();
    payment = await paymentRepo.save(
      paymentRepo.create(paymentData as Payment),
    );
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ✅ Positive test for create
  it('should create a payment', async () => {
    const dto = PaymentObjectMother.buildCreateDto({
      userId: user.id,
      courseId: course.id,
    });
    const createdPayment = await paymentRepo.create(dto);
    expect(createdPayment.amount).toBe(dto.amount);
    expect(createdPayment.user_id).toBe(user.id);
    expect(createdPayment.course_id).toBe(course.id);
    expect(createdPayment.id).toBeDefined();
  });

  // ❌ Negative test for create
  it('should throw when creating a payment with invalid data', async () => {
    const dto = PaymentObjectMother.buildCreateDto({
      userId: user.id,
      courseId: course.id,
      amount: undefined,
    });
    await expect(paymentRepo.create(dto)).rejects.toThrow(
      RepositoryUnknownError,
    );
  });

  // ✅ Positive test for findAll
  it('should find all payments', async () => {
    const payments = await paymentRepo.findAll();
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBeGreaterThan(0);
  });

  // ❌ Negative test for findAll
  it('should return empty array when no payments exist', async () => {
    await paymentRepo.delete(payment.id);
    const payments = await paymentRepo.findAll();
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBe(0);
  });

  // ✅ Positive test for findById
  it('should find payment by id', async () => {
    const found = await paymentRepo.findById(payment.id);
    expect(found?.id).toEqual(payment.id);
    expect(found?.amount).toBe(payment.amount);
  });

  // ❌ Negative test for findById
  it('should return null when payment not found', async () => {
    const found = await paymentRepo.findById(uuidv4());
    expect(found).toEqual(null);
  });

  // ✅ Positive test for findOrFailById
  it('should find payment by id or fail', async () => {
    const found = await paymentRepo.findOrFailById(payment.id);
    expect(found.id).toEqual(payment.id);
  });

  // ❌ Negative test for findOrFailById
  it('should throw when payment not found', async () => {
    await expect(paymentRepo.findOrFailById(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ✅ Positive test for findByUserAndCourse
  it('should find payment by user and course', async () => {
    const found = await paymentRepo.findByUserAndCourse(user.id, course.id);
    expect(found?.id).toBe(payment.id);
    expect(found?.user_id).toBe(user.id);
    expect(found?.course_id).toBe(course.id);
  });

  // ❌ Negative test for findByUserAndCourse
  it('should return null when payment not found by user and course', async () => {
    const found = await paymentRepo.findByUserAndCourse(uuidv4(), uuidv4());
    expect(found).toBeNull();
  });

  // ✅ Positive test for findAllByCourse
  it('should find all payments by course', async () => {
    const payments = await paymentRepo.findAllByCourse(course.id);
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBeGreaterThan(0);
    expect(payments[0].course_id).toBe(course.id);
  });

  // ❌ Negative test for findAllByCourse
  it('should return empty array when no payments for course', async () => {
    const payments = await paymentRepo.findAllByCourse(uuidv4());
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBe(0);
  });

  // ✅ Positive test for findAllByUser
  it('should find all payments by user', async () => {
    const payments = await paymentRepo.findAllByUser(user.id);
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBeGreaterThan(0);
    expect(payments[0].user_id).toBe(user.id);
  });

  // ❌ Negative test for findAllByUser
  it('should return empty array when no payments for user', async () => {
    const payments = await paymentRepo.findAllByUser(uuidv4());
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBe(0);
  });

  // ✅ Positive test for update
  it('should update payment', async () => {
    const dto = PaymentObjectMother.buildUpdateDto({ amount: 200 });
    const updated = await paymentRepo.update(payment.id, dto);
    expect(updated.amount).toBe(dto.amount);
  });

  // ❌ Negative test for update
  it('should throw when updating non-existing payment', async () => {
    const update: UpdatePaymentDto = PaymentObjectMother.buildUpdateDto();
    await expect(paymentRepo.update(uuidv4(), update)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ✅ Positive test for delete
  it('should delete payment', async () => {
    const deleted = await paymentRepo.delete(payment.id);

    expect(deleted.id).toBe(payment.id);
    await expect(paymentRepo.findOrFailById(payment.id)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ❌ Negative test for delete
  it('should throw when deleting non-existing payment', async () => {
    await expect(paymentRepo.delete(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });
});
