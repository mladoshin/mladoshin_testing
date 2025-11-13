import { CourseEnrollmentStatus } from "../../enums";
import { UserResponse } from "../user/user.response.dto";
import { CourseResponse } from "../course/course.response.dto";

export interface CourseEnrollmentResponse {
  id: string;
  user?: UserResponse;
  user_id: string;
  course?: CourseResponse;
  course_id: string;
  created_at: Date;
  status: CourseEnrollmentStatus;
}
