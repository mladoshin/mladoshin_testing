import { CourseEnrollmentDomain } from 'src/modules/course-enrollments/domains/course-enrollment.domain';
import { PaymentDomain } from 'src/modules/payments/domains/payment.domain';
import { UserRole } from '../entities/user.entity';
import { UserProfileDomain } from './user-profile.domain';

export class UserDomain {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfileDomain;
  payments?: PaymentDomain[];
  courseEnrollments?: CourseEnrollmentDomain[];
}
