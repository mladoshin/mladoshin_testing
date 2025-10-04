import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export class PaymentBuilder {
  private readonly payment: Payment;

  constructor() {
    const userId = uuidv4();
    const courseId = uuidv4();

    this.payment = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      amount: 100,
      user_id: userId,
      course_id: courseId,
      user: {} as User,
      course: {} as Course
    };
  }

  withId(id: string): this {
    this.payment.id = id;
    return this;
  }

  withAmount(amount: number): this {
    this.payment.amount = amount;
    return this;
  }

  withUserId(userId: string): this {
    this.payment.user_id = userId;
    return this;
  }

  withCourseId(courseId: string): this {
    this.payment.course_id = courseId;
    return this;
  }

  withTimestamp(timestamp: string): this {
    this.payment.timestamp = timestamp;
    return this;
  }

  build(): Payment {
    return this.payment;
  }
}
