import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import {
  CourseResponse,
  IUserAvailabilityResponse,
  IUserScheduleResponseDto,
} from '@shared/types';
import { UserScheduleDomain } from '../domains/user-schedule.domain';
import { UserResponse } from 'src/modules/users/dto/user-response.dto';
import { CourseLessonResponse } from 'src/modules/lessons/dto/lesson-response.dto';

export class UserScheduleResponse implements IUserScheduleResponseDto {
  id: string;
  user?: UserResponse | null;
  user_id: string;
  course?: CourseResponse | null;
  course_id: string;
  lesson?: CourseLessonResponse | null;
  lesson_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration: number;

  constructor(userSchedule: UserScheduleDomain) {
    const rest = instanceToPlain(userSchedule) as UserScheduleDomain;
    Object.assign(this, rest);
  }

  static make(userSchedule: UserScheduleDomain | null): UserScheduleResponse {
    if (!userSchedule) {
      throw new NotFoundException('Слот не найден');
    }

    return new UserScheduleResponse(userSchedule);
  }

  static collection(
    userSchedules: UserScheduleDomain[],
  ): UserScheduleResponse[] {
    return userSchedules.map(
      (userSchedule) => new UserScheduleResponse(userSchedule),
    );
  }
}
