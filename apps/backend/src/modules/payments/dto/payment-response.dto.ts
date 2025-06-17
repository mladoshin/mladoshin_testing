import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { PaymentDomain } from '../domains/payment.domain';

export class PaymentResponse {
  constructor(payment: PaymentDomain) {
    const rest = instanceToPlain(payment) as PaymentDomain;
    Object.assign(this, rest);
  }

  static make(payment: PaymentDomain | null): PaymentResponse {
    if (!payment) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new PaymentResponse(payment);
  }

  static collection(payments: PaymentDomain[]): PaymentResponse[] {
    return payments.map((payment) => new PaymentResponse(payment));
  }
}
