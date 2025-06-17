import { CourseDomain } from 'src/modules/courses/domains/course.domain';
import { CourseEnrollmentStatus } from 'src/modules/courses/types/courses.types';
import { User } from 'src/modules/users/entities/user.entity';

export class CourseEnrollmentDomain {
  id: string;
  user?: User;
  user_id: string;
  course?: CourseDomain;
  course_id: string;
  created_at: Date;
  status: CourseEnrollmentStatus;
}
