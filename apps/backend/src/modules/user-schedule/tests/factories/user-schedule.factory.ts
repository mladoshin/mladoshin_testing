// tests/factories/user-schedule.factory.ts
import { UserScheduleDomain } from '../../domains/user-schedule.domain';

export class UserScheduleFactory {
  static default(): UserScheduleDomain {
    const now = new Date().toISOString();
    return {
      id: 'schedule-1',
      course_id: '11111111-1111-1111-1111-111111111111',
      lesson_id: '22222222-2222-2222-2222-222222222222',
      duration: 60,
      start_time: '09:00:00',
      end_time: '10:00:00',
      scheduled_date: now,
      user_id: 'user-1',
    };
  }
}
