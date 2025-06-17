import { CourseEnrollmentStatus } from "../enums/course-enrollment-status.enum";
import { CourseEntity } from "./course.entity";
import { UserEntity } from "./user.entity";

export class CourseEnrollmentEntity {
  id: string;
  user?: UserEntity | null;
  user_id: string;
  course?: CourseEntity | null;
  course_id: string;
  created_at: Date;
  status: CourseEnrollmentStatus;
}
