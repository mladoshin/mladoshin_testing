import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Payment } from '../entities/payment.entity';

export class PaymentResponse {
  constructor(payment: Payment) {
    const rest = instanceToPlain(payment) as Payment;
    Object.assign(this, rest);
  }

  static make(payment: Payment | null): PaymentResponse {
    if (!payment) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new PaymentResponse(payment);
  }

  static collection(payments: Payment[]): PaymentResponse[] {
    return payments.map((payment) => new PaymentResponse(payment));
  }
}
