import { CourseMapper } from '../courses/courses.mapper';
import { UsersMapper } from '../users/users.mapper';
import { PaymentDomain } from './domains/payment.domain';
import { Payment } from './entities/payment.entity';

export class PaymentsMapper {
  static toDomainEntity(payment: Payment): PaymentDomain {
    return {
      id: payment.id,
      timestamp: payment.timestamp,
      amount: payment.amount,
      course: payment.course ? CourseMapper.toDomainEntity(payment.course) : null,
      course_id: payment.course_id,
      user: payment.user ? UsersMapper.toDomainEntity(payment.user) : null,
      user_id: payment.user_id,
    };
  }
}
