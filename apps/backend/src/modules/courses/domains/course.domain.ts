import { CourseEnrollmentStatus } from '../types/courses.types';
import { PaymentDomain } from 'src/modules/payments/domains/payment.domain';
import { CourseEnrollmentDomain } from 'src/modules/course-enrollments/domains/course-enrollment.domain';
import { CourseLessonDomain } from 'src/modules/lessons/domains/lesson.domain';

export class CourseDomain {
  id: string;
  price: number;
  name: string;
  date_start: string;
  date_finish: string;
  lessons?: CourseLessonDomain[];
  payments?: PaymentDomain[];
  courseEnrollments?: CourseEnrollmentDomain[];
}

export class CourseDomainWithEnrollmentStatus extends CourseDomain {
  enrollment_status: CourseEnrollmentStatus | null;
}
