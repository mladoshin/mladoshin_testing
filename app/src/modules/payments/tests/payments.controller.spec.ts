// payments.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController }  from '../payments.controller';
import { PaymentsService }     from '../payments.service';
import { CreatePaymentDto }    from '../dto/create-payment.dto';
import { UpdatePaymentDto }    from '../dto/update-payment.dto';
import { PaymentResponse }     from '../dto/payment-response.dto';
import { Payment } from '../entities/payment.entity';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: Partial<Record<keyof PaymentsService, jest.Mock>>;

  beforeAll(async () => {
    service = {
      create:  jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update:  jest.fn(),
      remove:  jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: service },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample payment entity
  const samplePayment: Payment = {
    id: 'pay-1',
    user_id: 'user-1',
    amount: 100.00,
    timestamp: "2025-01-01T18:37:00",
    course_id: 'course-1',
    course: {} as any,
    user: {} as any
  };
  const response = PaymentResponse.make(samplePayment);
  const responseList = [response];

  describe('create', () => {
    it('should create a payment and return PaymentResponse', async () => {
      const dto: CreatePaymentDto = {
        userId: 'user-1',
        amount: 100.00,
      };
      service.create!.mockResolvedValue(samplePayment);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('findAll', () => {
    it('should return an array of PaymentResponse', async () => {
      service.findAll!.mockResolvedValue([samplePayment]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(responseList);
    });
  });

  describe('findOne', () => {
    it('should return a single PaymentResponse', async () => {
      service.findOne!.mockResolvedValue(samplePayment);

      const result = await controller.findOne('pay-1');

      expect(service.findOne).toHaveBeenCalledWith('pay-1');
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('should update a payment and return PaymentResponse', async () => {
      const dto: UpdatePaymentDto = { status: 'completed' };
      const updated = { ...samplePayment, ...dto };
      service.update!.mockResolvedValue(updated);

      const result = await controller.update('pay-1', dto);

      expect(service.update).toHaveBeenCalledWith('pay-1', dto);
      expect(result).toEqual(PaymentResponse.make(updated));
    });
  });

  describe('remove', () => {
    it('should remove a payment and return PaymentResponse', async () => {
      service.remove!.mockResolvedValue(samplePayment);

      const result = await controller.remove('pay-1');

      expect(service.remove).toHaveBeenCalledWith('pay-1');
      expect(result).toEqual(response);
    });
  });
});
