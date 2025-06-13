import { CourseLesson } from '../../lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';

export class CourseDomain {
  id: string;
  price: number;
  name: string;
  date_start: string;
  date_finish: string;
  lessons?: CourseLesson[];
  payments?: Payment[];
  courseEnrollments?: CourseEnrollment[];
}
