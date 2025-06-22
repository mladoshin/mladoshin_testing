import {
  ICreateUserScheduleDto,
  IUserScheduleResponseDto,
} from "@shared/types";
import { CourseAdapter } from "@/entities/course/model/adapters";
import { UserAdapter } from "@/entities/user/model/adapters";
import { UserSchedule } from "./types";
import { LessonAdapter } from "@/entities/lesson/model/adapters";

export class UserScheduleAdapter {
  static mapFromResponse = (res: IUserScheduleResponseDto): UserSchedule => ({
    id: res.id,
    user: res.user ? UserAdapter.mapFromResponse(res.user) : null,
    userId: res.user_id,
    course: res.course ? CourseAdapter.mapFromResponse(res.course) : null,
    courseId: res.course_id,
    lesson: res.lesson ? LessonAdapter.mapFromResponse(res.lesson) : null,
    lessonId: res.lesson_id,
    scheduledDate: new Date(res.scheduled_date),
    startTime: res.start_time,
    endTime: res.end_time,
    duration: Number(res.duration),
  });

  static mapToDto = (entity: UserSchedule): ICreateUserScheduleDto => ({
    course_id: entity.courseId,
    duration: entity.duration,
    end_time: entity.endTime.substring(0,5),
    lesson_id: entity.lessonId,
    scheduled_date: entity.scheduledDate.toISOString(),
    start_time: entity.startTime.substring(0,5),
  });
}
