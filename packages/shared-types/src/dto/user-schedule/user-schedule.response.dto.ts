import { CourseResponse } from "../course";
import { LessonResponse } from "../lesson";
import { UserResponse } from "../user/user.response.dto";

export interface IUserScheduleResponseDto {
  id: string;
  user?: UserResponse | null;
  user_id: string;
  course?: CourseResponse | null;
  course_id: string;
  lesson?: LessonResponse | null;
  lesson_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration: number;
}
