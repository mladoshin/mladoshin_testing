// tests/builders/payment.builder.ts
import { CreatePaymentDto } from '../../dto/create-payment.dto';
import { UpdatePaymentDto } from '../../dto/update-payment.dto';

export class PaymentBuilder {
  private amount = 1000;
  private courseId = 'course-1';
  private userId = 'user-1';

  withAmount(amount: number) {
    this.amount = amount;
    return this;
  }

  withCourseId(courseId: string) {
    this.courseId = courseId;
    return this;
  }

  withUserId(userId: string) {
    this.userId = userId;
    return this;
  }

  buildCreateDto(): CreatePaymentDto {
    return {
      amount: this.amount,
      courseId: this.courseId,
      userId: this.userId,
    };
  }

  buildUpdateDto(): UpdatePaymentDto {
    return {
      amount: this.amount,
      courseId: this.courseId,
    };
  }
}
