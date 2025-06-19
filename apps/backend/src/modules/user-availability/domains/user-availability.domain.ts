import { CourseDomain } from "src/modules/courses/domains/course.domain";
import { UserDomain } from "src/modules/users/domains/user.domain";

export class UserAvailabilityDomain {
  id: string;
  user?: UserDomain | null;
  user_id: string;
  course?: CourseDomain | null;
  course_id: string;
  week_day: number;
  start_time: string;
  end_time: string;
}