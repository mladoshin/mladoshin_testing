import { CourseDomain } from "src/modules/courses/domains/course.domain";
import { UserDomain } from "src/modules/users/domains/user.domain";

export class UserAvailabilityDomain {
  id: string;
  user?: UserDomain | null;
  course?: CourseDomain | null;
  week_day: number;
  start_time: string;
  end_time: string;
}