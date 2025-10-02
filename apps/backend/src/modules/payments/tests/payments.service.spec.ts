import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments.service';
import { IPaymentRepo } from '../payments.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentDomain } from '../domains/payment.domain';
import { PaymentFactory } from './factories/payment.factory';
import { PaymentBuilder } from './builders/payment.builder';

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

  describe('create', () => {
    it('✅ should create a payment', async () => {
      const dto: CreatePaymentDto = new PaymentBuilder().buildCreateDto();
      const payment = PaymentFactory.default();

      repo.create.mockResolvedValue(payment);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(payment);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      const dto = new PaymentBuilder().buildCreateDto();
      repo.create.mockRejectedValue(new Error('DB down'));

      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  describe('findAll', () => {
    it('✅ should return all payments', async () => {
      const payments = [PaymentFactory.default()];
      repo.findAll.mockResolvedValue(payments);

      const result = await service.findAll();

      expect(result).toEqual(payments);
    });

    it('❌ should return empty array if no payments', async () => {
      repo.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.findAll.mockRejectedValue(new Error('DB down'));
      await expect(service.findAll()).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('✅ should return a payment by id', async () => {
      const payment = PaymentFactory.default();
      repo.findOrFailById.mockResolvedValue(payment);

      const result = await service.findOne('payment-1');

      expect(result).toEqual(payment);
    });

    it('❌ should throw NotFoundException for invalid id', async () => {
      repo.findOrFailById.mockRejectedValue(
        new RepositoryNotFoundError('Payment', 'invalid-id'),
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(RepositoryNotFoundError);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.findOrFailById.mockRejectedValue(new Error('DB crashed'));
      await expect(service.findOne('payment-1')).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('✅ should update a payment', async () => {
      const updateDto: UpdatePaymentDto = new PaymentBuilder()
        .withAmount(500)
        .buildUpdateDto();
      const payment = PaymentFactory.default();
      repo.update.mockResolvedValue({ ...payment, ...updateDto });

      const result = await service.update('payment-1', updateDto);

      expect(result.amount).toBe(500);
    });

    it('❌ should throw NotFoundException if payment not found', async () => {
      repo.update.mockRejectedValue(
        new RepositoryNotFoundError('Payment', 'payment-1'),
      );
      await expect(service.update('payment-1', { amount: 100 })).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.update.mockRejectedValue(new Error('DB crashed'));
      await expect(service.update('payment-1', { amount: 100 })).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('✅ should remove a payment', async () => {
      const payment = PaymentFactory.default();
      repo.delete.mockResolvedValue(payment);

      const result = await service.remove('payment-1');

      expect(result).toEqual(payment);
    });

    it('❌ should throw NotFoundException for invalid id', async () => {
      repo.delete.mockRejectedValue(new RepositoryNotFoundError('Payment', ''));
      await expect(service.remove('')).rejects.toThrow(RepositoryNotFoundError);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.delete.mockRejectedValue(new Error('DB crashed'));
      await expect(service.remove('payment-1')).rejects.toThrow(Error);
    });
  });
});
