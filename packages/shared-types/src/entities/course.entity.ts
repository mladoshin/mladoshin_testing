import { CourseEnrollmentEntity } from "./course-enrollment.entity";
import { CourseLessonEntity } from "./course-lesson.entity";
import { PaymentEntity } from "./payment.entity";

export class CourseEntity {
  id: string;
  price: number;
  name: string;
  date_start: string;
  date_finish: string;
  lessons?: CourseLessonEntity[];
  payments?: PaymentEntity[];
  courseEnrollments?: CourseEnrollmentEntity[];
}
