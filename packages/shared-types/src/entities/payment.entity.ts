import { CourseEntity } from './course.entity';
import { UserEntity } from './user.entity';

export interface PaymentEntity {
  id: string;
  timestamp: string;
  amount: number;
  course: CourseEntity | null;
  course_id: string;
  user: UserEntity | null;
  user_id: string;
}
