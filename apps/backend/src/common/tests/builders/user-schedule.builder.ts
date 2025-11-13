import { UserSchedule } from 'src/modules/user-schedule/entities/user-schedule.entity';
import { v4 as uuidv4 } from 'uuid';

export class UserScheduleBuilder {
  private readonly userSchedule: UserSchedule;

  constructor() {
    const userId = uuidv4();
    const courseId = uuidv4();
    const lessonId = uuidv4();

    this.userSchedule = {
      id: uuidv4(),
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      scheduled_date: '2025-06-26',
      start_time: '10:00:00',
      end_time: '11:00:00',
      duration: 60,
    } as UserSchedule;
  }

  withId(id: string): this {
    this.userSchedule.id = id;
    return this;
  }

  withUserId(userId: string): this {
    this.userSchedule.user_id = userId;
    return this;
  }

  withCourseId(courseId: string): this {
    this.userSchedule.course_id = courseId;
    return this;
  }

  withLessonId(lessonId: string): this {
    this.userSchedule.lesson_id = lessonId;
    return this;
  }

  withScheduledDate(scheduledDate: string): this {
    this.userSchedule.scheduled_date = scheduledDate;
    return this;
  }

  withStartTime(startTime: string): this {
    this.userSchedule.start_time = startTime;
    return this;
  }

  withEndTime(endTime: string): this {
    this.userSchedule.end_time = endTime;
    return this;
  }

  withDuration(duration: number): this {
    this.userSchedule.duration = duration;
    return this;
  }

  build(): UserSchedule {
    return this.userSchedule;
  }
}
