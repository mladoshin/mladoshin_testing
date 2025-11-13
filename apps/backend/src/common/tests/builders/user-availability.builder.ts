import { UserAvailability } from 'src/modules/user-availability/entities/user-availability.entity';
import { v4 as uuidv4 } from 'uuid';

export class UserAvailabilityBuilder {
  private readonly availability: UserAvailability;

  constructor() {
    this.availability = {
      id: uuidv4(),
      user_id: uuidv4(),
      course_id: uuidv4(),
      week_day: 1, // Понедельник
      start_time: '09:00:00',
      end_time: '17:00:00',
    } as UserAvailability;
  }

  withId(id: string): this {
    this.availability.id = id;
    return this;
  }

  withUserId(userId: string): this {
    this.availability.user_id = userId;
    return this;
  }

  withCourseId(courseId: string): this {
    this.availability.course_id = courseId;
    return this;
  }

  withWeekDay(weekDay: number): this {
    this.availability.week_day = weekDay;
    return this;
  }

  withStartTime(startTime: string): this {
    this.availability.start_time = startTime;
    return this;
  }

  withEndTime(endTime: string): this {
    this.availability.end_time = endTime;
    return this;
  }

  build(): UserAvailability {
    return this.availability;
  }
}
