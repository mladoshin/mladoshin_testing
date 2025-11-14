import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../../payments.controller';
import { IPaymentsService } from '../../payments.service';
import { CreatePaymentDto } from '../../dto/create-payment.dto';
import { UpdatePaymentDto } from '../../dto/update-payment.dto';
import { PaymentResponse } from '../../dto/payment-response.dto';
import { IAppLoggerService } from 'src/common/logging/log.service';
import { PaymentBuilder } from 'src/common/tests/builders/payment.builder';
import { PaymentObjectMother } from 'src/common/tests/object-mothers/payment-object-mother';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

describe('PaymentsController (unit)', () => {
  let controller: PaymentsController;
  let service: Partial<Record<keyof IPaymentsService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;
  let mockReq: any;

  beforeAll(async () => {
    mockReq = {
      headers: {
        'x-test-schema': 'test_schema',
      },
    };
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockLoggerService = {
      accessLog: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: 'IPaymentsService', useValue: service },
        { provide: 'IAppLoggerService', useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать платеж и вернуть PaymentResponse', async () => {
      // Используем ObjectMother для создания DTO
      const dto: CreatePaymentDto = PaymentObjectMother.buildCreateDto({
        userId: 'user-1',
        courseId: 'course-1',
        amount: 100.0,
      });

      // Используем Builder для создания сущности
      const payment = new PaymentBuilder()
        .withUserId('user-1')
        .withCourseId('course-1')
        .withAmount(100.0)
        .build();

      service.create!.mockResolvedValue(payment);

      const result = await controller.create(dto, mockReq);

      expect(service.create).toHaveBeenCalledWith(dto, {schema: 'test_schema'});
      expect(result).toMatchObject({
        amount: payment.amount,
        user_id: payment.user_id,
        course_id: payment.course_id,
      });
    });

    it('❌ должен выбросить ошибку при создании платежа с некорректными данными', async () => {
      const dto: CreatePaymentDto = PaymentObjectMother.buildCreateDto();

      service.create!.mockRejectedValue(new Error('Ошибка создания платежа'));

      await expect(controller.create(dto, mockReq)).rejects.toThrow('Ошибка создания платежа');
      expect(service.create).toHaveBeenCalledWith(dto, {schema: 'test_schema'});
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('✅ должен вернуть массив PaymentResponse', async () => {
      const payment1 = new PaymentBuilder()
        .withUserId('user-1')
        .withCourseId('course-1')
        .build();
      const payment2 = new PaymentBuilder()
        .withUserId('user-2')
        .withCourseId('course-2')
        .build();

      service.findAll!.mockResolvedValue([payment1, payment2]);

      const result = await controller.findAll(mockReq);

      expect(service.findAll).toHaveBeenCalledWith({schema: 'test_schema'});
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ user_id: payment1.user_id });
      expect(result[1]).toMatchObject({ user_id: payment2.user_id });
    });

    it('❌ должен вернуть пустой массив когда платежей нет', async () => {
      service.findAll!.mockResolvedValue([]);

      const result = await controller.findAll(mockReq);

      expect(service.findAll).toHaveBeenCalledWith({schema: 'test_schema'});
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('✅ должен вернуть один PaymentResponse', async () => {
      const payment = new PaymentBuilder()
        .withId('pay-1')
        .withUserId('user-1')
        .withCourseId('course-1')
        .build();

      service.findOne!.mockResolvedValue(payment);

      const result = await controller.findOne('pay-1', mockReq);

      expect(service.findOne).toHaveBeenCalledWith('pay-1', {schema: 'test_schema'});
      expect(result).toMatchObject({
        id: payment.id,
        user_id: payment.user_id,
      });
    });

    it('❌ должен выбросить ошибку когда платеж не найден', async () => {
      service.findOne!.mockRejectedValue(
        new RepositoryNotFoundError('Платеж не найден', 'Payment'),
      );

      await expect(controller.findOne('invalid-id', mockReq)).rejects.toThrow(
        RepositoryNotFoundError,
      );
      expect(service.findOne).toHaveBeenCalledWith('invalid-id', {schema: 'test_schema'});
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('✅ должен обновить платеж и вернуть PaymentResponse', async () => {
      const dto: UpdatePaymentDto = PaymentObjectMother.buildUpdateDto({
        amount: 200,
      });

      const updatedPayment = new PaymentBuilder()
        .withId('pay-1')
        .withAmount(200)
        .build();

      service.update!.mockResolvedValue(updatedPayment);

      const result = await controller.update('pay-1', dto, mockReq);

      expect(service.update).toHaveBeenCalledWith('pay-1', dto, {schema: 'test_schema'});
      expect(result).toMatchObject({
        amount: 200,
        id: 'pay-1',
      });
    });

    it('❌ должен выбросить ошибку при обновлении несуществующего платежа', async () => {
      const dto: UpdatePaymentDto = PaymentObjectMother.buildUpdateDto({
        amount: 200,
      });

      service.update!.mockRejectedValue(
        new RepositoryNotFoundError('Платеж не найден', 'Payment'),
      );

      await expect(controller.update('invalid-id', dto, mockReq)).rejects.toThrow(
        RepositoryNotFoundError,
      );
      expect(service.update).toHaveBeenCalledWith('invalid-id', dto, {schema: 'test_schema'});
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('✅ должен удалить платеж и вернуть PaymentResponse', async () => {
      const payment = new PaymentBuilder()
        .withId('pay-1')
        .withUserId('user-1')
        .build();

      service.remove!.mockResolvedValue(payment);

      const result = await controller.remove('pay-1', mockReq);

      expect(service.remove).toHaveBeenCalledWith('pay-1', {schema: 'test_schema'});
      expect(result).toMatchObject({ id: payment.id });
    });

    it('❌ должен выбросить ошибку при удалении несуществующего платежа', async () => {
      service.remove!.mockRejectedValue(
        new RepositoryNotFoundError('Платеж не найден', 'Payment'),
      );

      await expect(controller.remove('invalid-id', mockReq)).rejects.toThrow(
        RepositoryNotFoundError,
      );
      expect(service.remove).toHaveBeenCalledWith('invalid-id', {schema: 'test_schema'});
    });
  });
});
