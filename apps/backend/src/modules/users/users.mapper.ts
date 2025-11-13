import { CourseEnrollementMapper } from '../course-enrollments/course-enrollments.mapper';
import { PaymentsMapper } from '../payments/payments.mapper';
import { UserDomain } from './domains/user.domain';
import { User } from './entities/user.entity';

export class UsersMapper {
  static toDomainEntity(user: User): UserDomain {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: user.role,
      profile: user.profile,
      courseEnrollments: user.courseEnrollments?.map((enrollment) =>
        CourseEnrollementMapper.toDomainEntity(enrollment),
      ),
      payments: user.payments?.map((payment) =>
        PaymentsMapper.toDomainEntity(payment),
      ),
    };
  }
}
