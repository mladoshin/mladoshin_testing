// tests/builders/user-availability.builder.ts
import { CreateUserAvailabilityDto } from '../../dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from '../../dto/update-user-availability.dto';

export class UserAvailabilityBuilder {
  private course_id = '1';
  private week_day = 1; // понедельник
  private start_time = '09:00:00';
  private end_time = '10:00:00';

  withCourseId(course_id: string) {
    this.course_id = course_id;
    return this;
  }

  withWeekDay(week_day: number) {
    this.week_day = week_day;
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

  buildCreateDto(): CreateUserAvailabilityDto {
    return {
      course_id: this.course_id,
      week_day: this.week_day,
      start_time: this.start_time,
      end_time: this.end_time,
    };
  }

  buildUpdateDto(): UpdateUserAvailabilityDto {
    return {
      week_day: this.week_day,
      start_time: this.start_time,
      end_time: this.end_time,
    };
  }
}
