import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../../payments.service';
import { IPaymentRepo } from '../../payments.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { PaymentObjectMother } from 'src/common/tests/object-mothers/payment-object-mother';
import { PaymentBuilder } from 'src/common/tests/builders/payment.builder';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repo: jest.Mocked<IPaymentRepo>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<IPaymentRepo> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOrFailById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAllByCourse: jest.fn(),
      findById: jest.fn(),
      findAllByUser: jest.fn(),
      findByUserAndCourse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: 'IPaymentRepo', useValue: repoMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repo = module.get('IPaymentRepo');
  });

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать платеж', async () => {
      const dto = PaymentObjectMother.buildCreateDto();
      const payment = new PaymentBuilder()
        .withAmount(dto.amount)
        .withUserId(dto.userId)
        .withCourseId(dto.courseId)
        .build();

      repo.create.mockResolvedValue(payment);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(payment);
    });

    it('❌ должен выбросить ошибку при ошибке репозитория', async () => {
      const dto = PaymentObjectMother.buildCreateDto();
      repo.create.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('✅ должен вернуть все платежи', async () => {
      const payment = new PaymentBuilder().build();
      const payments = [payment];
      repo.findAll.mockResolvedValue(payments);

      const result = await service.findAll();

      expect(result).toEqual(payments);
    });

    it('❌ должен вернуть пустой массив если платежей нет', async () => {
      repo.findAll.mockResolvedValue([]);
      
      const result = await service.findAll();
      
      expect(result).toEqual([]);
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('✅ должен вернуть платеж по id', async () => {
      const payment = new PaymentBuilder().build();
      repo.findOrFailById.mockResolvedValue(payment);

      const result = await service.findOne('payment-1');

      expect(result).toEqual(payment);
    });

    it('❌ должен выбросить ошибку для несуществующего id', async () => {
      repo.findOrFailById.mockRejectedValue(
        new RepositoryNotFoundError('Платеж не найден.', 'Payment'),
      );
      
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('✅ должен обновить платеж', async () => {
      const updateDto = PaymentObjectMother.buildUpdateDto({ amount: 500 });
      const payment = new PaymentBuilder().withAmount(500).build();
      repo.update.mockResolvedValue(payment);

      const result = await service.update('payment-1', updateDto);

      expect(result.amount).toBe(500);
    });

    it('❌ должен выбросить ошибку если платеж не найден', async () => {
      const updateDto = PaymentObjectMother.buildUpdateDto();
      repo.update.mockRejectedValue(
        new RepositoryNotFoundError('Платеж не найден.', 'Payment'),
      );
      
      await expect(service.update('payment-1', updateDto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('✅ должен удалить платеж', async () => {
      const payment = new PaymentBuilder().build();
      repo.delete.mockResolvedValue(payment);

      const result = await service.remove('payment-1');

      expect(result).toEqual(payment);
    });

    it('❌ должен выбросить ошибку для несуществующего id', async () => {
      repo.delete.mockRejectedValue(
        new RepositoryNotFoundError('Платеж не найден.', 'Payment'),
      );
      
      await expect(service.remove('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
