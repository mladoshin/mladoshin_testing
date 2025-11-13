import { CreatePaymentDto } from 'src/modules/payments/dto/create-payment.dto';
import { UpdatePaymentDto } from 'src/modules/payments/dto/update-payment.dto';
import { v4 as uuidv4 } from 'uuid';

export class PaymentObjectMother {
  static buildCreateDto(overrides?: Partial<CreatePaymentDto>): CreatePaymentDto {
    const dto: CreatePaymentDto = {
      amount: 100,
      userId: uuidv4(),
      courseId: uuidv4(),
      ...overrides,
    };

    return dto;
  }

  static buildUpdateDto(overrides?: Partial<UpdatePaymentDto>): UpdatePaymentDto {
    const dto: UpdatePaymentDto = {
      amount: 200,
      ...overrides,
    };

    return dto;
  }
}
