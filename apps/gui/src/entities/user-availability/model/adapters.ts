import { IUserAvailabilityResponse } from "@shared/types";
import { UserAvailability } from "./types";
import { CourseAdapter } from "@/entities/course/model/adapters";
import { UserAdapter } from "@/entities/user/model/adapters";

export class UserAvailabilityAdapter {
  static mapFromResponse = (res: IUserAvailabilityResponse): UserAvailability => ({
    id: res.id,
    startTime: res.start_time.substring(0,5),
    endTime: res.end_time.substring(0,5),
    weekDay: res.week_day,
    course: res.course ? CourseAdapter.mapFromResponse(res.course) : null,
    user: res.user ? UserAdapter.mapFromResponse(res.user) : null
  });
}
