import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { PaymentBuilder } from 'src/common/tests/builders/payment.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { PaymentObjectMother } from 'src/common/tests/object-mothers/payment-object-mother';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { Course } from 'src/modules/courses/entities/course.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PaymentsModule } from '../../payments.module';
import { IPaymentsService } from '../../payments.service';
import { CreatePaymentDto } from '../../dto/create-payment.dto';
import { UpdatePaymentDto } from '../../dto/update-payment.dto';
import { Payment } from '../../entities/payment.entity';

describe('PaymentsService (Integration)', () => {
  let service: IPaymentsService;
  let dataSource: DataSource;
  let user: User;
  let course: Course;
  let payment: Payment;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let paymentRepo: Repository<Payment>;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    const module: TestingModule = await Test.createTestingModule({
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
        PaymentsModule,
        CoursesModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<IPaymentsService>('IPaymentsService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
    courseRepo = dataSource.getRepository(Course);
    paymentRepo = dataSource.getRepository(Payment);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Создаём пользователя через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    // Создаём курс через билдер
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    // Создаём платеж через билдер
    const paymentData = new PaymentBuilder()
      .withUserId(user.id)
      .withCourseId(course.id)
      .build();
    payment = await paymentRepo.save(
      paymentRepo.create(paymentData as Payment),
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать платеж', async () => {
      const dto: CreatePaymentDto = PaymentObjectMother.buildCreateDto({
        userId: user.id,
        courseId: course.id,
      });
      const createdPayment = await service.create(dto);
      expect(createdPayment.amount).toBe(dto.amount);
      expect(createdPayment.id).toBeDefined();
      expect(createdPayment.user_id).toBe(dto.userId);
      expect(createdPayment.course_id).toBe(dto.courseId);
    });

    it('❌ ошибка при создании платежа с пустой суммой', async () => {
      const dto: CreatePaymentDto = PaymentObjectMother.buildCreateDto({
        amount: null,
        userId: user.id,
        courseId: course.id,
      } as any);
      await expect(service.create(dto)).rejects.toThrow(RepositoryUnknownError);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('✅ возвращает один платеж изначально', async () => {
      const payments = await service.findAll();
      expect(payments).toHaveLength(1);
    });

    it('❌ возвращает пустой список после удаления платежа', async () => {
      await service.remove(payment.id);
      const payments = await service.findAll();
      expect(payments).toEqual([]);
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('✅ возвращает платеж по id', async () => {
      const found = await service.findOne(payment.id);
      expect(found.id).toBe(payment.id);
    });

    it('❌ выбрасывает ошибку, если платеж не существует', async () => {
      await expect(service.findOne(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('✅ обновляет платеж', async () => {
      const dto: UpdatePaymentDto = PaymentObjectMother.buildUpdateDto({
        amount: 250,
      });
      const updated = await service.update(payment.id, dto);
      expect(updated.amount).toBe(dto.amount);
    });

    it('❌ выбрасывает ошибку при обновлении несуществующего платежа', async () => {
      const dto: UpdatePaymentDto = PaymentObjectMother.buildUpdateDto();

      await expect(service.update(uuidv4(), dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('✅ удаляет платеж', async () => {
      const removed = await service.remove(payment.id);
      expect(removed.id).toBe(payment.id);
    });

    it('❌ выбрасывает ошибку при удалении несуществующего платежа', async () => {
      await expect(service.remove(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
