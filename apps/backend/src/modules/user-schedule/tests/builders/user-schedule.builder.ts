// tests/builders/user-schedule.builder.ts
import { CreateUserScheduleDto } from '../../dto/create-user-schedule.dto';

export class UserScheduleBuilder {
  private course_id = '11111111-1111-1111-1111-111111111111';
  private lesson_id = '22222222-2222-2222-2222-222222222222';
  private duration = 60;
  private start_time = '09:00:00';
  private end_time = '10:00:00';
  private scheduled_date = new Date().toISOString();

  withCourseId(course_id: string) {
    this.course_id = course_id;
    return this;
  }

  withLessonId(lesson_id: string) {
    this.lesson_id = lesson_id;
    return this;
  }

  withDuration(duration: number) {
    this.duration = duration;
    return this;
  }

  withStartTime(start_time: string) {
    this.start_time = start_time;
    return this;
  }

  withEndTime(end_time: string) {
    this.end_time = end_time;
    return this;
  }

  withScheduledDate(scheduled_date: string) {
    this.scheduled_date = scheduled_date;
    return this;
  }

  buildCreateDto(): CreateUserScheduleDto {
    return {
      course_id: this.course_id,
      lesson_id: this.lesson_id,
      duration: this.duration,
      start_time: this.start_time,
      end_time: this.end_time,
      scheduled_date: this.scheduled_date,
    };
  }
}
