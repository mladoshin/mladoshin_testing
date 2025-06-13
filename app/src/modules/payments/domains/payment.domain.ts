import { CourseDomain } from 'src/modules/courses/domains/course.domain';
import { Course } from 'src/modules/courses/entities/course.entity';
import { UserDomain } from 'src/modules/users/domains/user.domain';

export class PaymentDomain {
  id: string;
  timestamp: string;
  amount: number;
  course: CourseDomain | null;
  course_id: string;
  user: UserDomain | null;
  user_id: string;
}
