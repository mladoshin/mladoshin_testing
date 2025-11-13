import { UserProfileEntity } from './user-profile.entity';
import { PaymentEntity } from './payment.entity';
import { CourseEnrollmentEntity } from './course-enrollment.entity';
import { UserRole } from '../enums/user-role.enum';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfileEntity;
  payments?: PaymentEntity[];
  courseEnrollments?: CourseEnrollmentEntity[];
}
