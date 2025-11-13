import { getDurationInMinutes } from 'src/common/utils/utils';
import { CourseMapper } from '../courses/courses.mapper';
import { CourseLessonMapper } from '../lessons/lessons.mapper';
import { UsersMapper } from '../users/users.mapper';
import { UserScheduleDomain } from './domains/user-schedule.domain';
import { GenerateUserScheduleResponseDto } from './dto/generate-schedule-response.dto';
import { UserSchedule } from './entities/user-schedule.entity';
import dayjs from 'dayjs';
import { Course } from '../courses/entities/course.entity';

export class UserScheduleMapper {
  static fromFunctionToDomainEntity(
    functionEntity: GenerateUserScheduleResponseDto,
    courseId: string,
    userId: string,
  ): UserScheduleDomain {
    const duration = getDurationInMinutes(
      functionEntity.start_time,
      functionEntity.end_time,
    );
    const lesson = CourseLessonMapper.toDomainEntity({
      id: functionEntity.lesson_id,
      course_id: courseId,
      title: functionEntity.title,
      course: null as any,
      content: functionEntity.content,
      date: functionEntity.date,
      duration: functionEntity.duration,
    });

    return {
      id: 'not_created',
      user_id: userId,
      course_id: courseId,
      lesson_id: functionEntity.lesson_id,
      lesson: lesson,
      scheduled_date: functionEntity.scheduled_date,
      duration: duration,
      start_time: functionEntity.start_time,
      end_time: functionEntity.end_time,
    };
  }

  static toDomainEntity(userSchedule: UserSchedule): UserScheduleDomain {
    return {
      id: userSchedule.id,
      user: userSchedule.user
        ? UsersMapper.toDomainEntity(userSchedule.user)
        : null,
      user_id: userSchedule.user_id,
      course: userSchedule.course
        ? CourseMapper.toDomainEntity(userSchedule.course)
        : null,
      course_id: userSchedule.course_id,
      lesson: userSchedule.lesson
        ? CourseLessonMapper.toDomainEntity(userSchedule.lesson)
        : null,
      lesson_id: userSchedule.lesson_id,
      scheduled_date: userSchedule.scheduled_date,
      duration: userSchedule.duration,
      start_time: userSchedule.start_time,
      end_time: userSchedule.end_time,
    };
  }
}
