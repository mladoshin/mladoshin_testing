import { UserProfileEntity } from './user-profile.entity.ts';
import { PaymentEntity } from './payment.entity.ts';
import { CourseEnrollmentEntity } from './course-enrollment.entity.ts';
import { UserRole } from '../enums/user-role.enum.ts';

export class UserEntity {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfileEntity;
  payments?: PaymentEntity[];
  courseEnrollments?: CourseEnrollmentEntity[];
}
