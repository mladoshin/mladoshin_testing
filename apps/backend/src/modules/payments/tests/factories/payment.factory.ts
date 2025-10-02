// tests/factories/payment.factory.ts
import { PaymentDomain } from '../../domains/payment.domain';

export class PaymentFactory {
  static default(): PaymentDomain {
    return {
      id: 'payment-1',
      amount: 1000,
      course_id: 'course-1',
      user_id: 'user-1',
      user: null,
      course: null,
      timestamp: new Date().toISOString(),
    };
  }
}
