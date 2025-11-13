import { CourseResponse } from "../course/course.response.dto";
import { UserResponse } from "../user/user.response.dto";

export interface IUserAvailabilityResponse {
  id: string;
  user?: UserResponse | null;
  course?: CourseResponse | null;
  week_day: number;
  start_time: string;
  end_time: string;
}
