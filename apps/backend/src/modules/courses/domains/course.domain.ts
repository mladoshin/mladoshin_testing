import { CourseLesson } from '../../lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { CourseEnrollmentStatus } from '../types/courses.types';

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

export class CourseDomainWithEnrollmentStatus extends CourseDomain {
  enrollment_status: CourseEnrollmentStatus | null;
}
