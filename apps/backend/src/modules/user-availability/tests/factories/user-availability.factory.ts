// tests/factories/user-availability.factory.ts
import { UserAvailabilityDomain } from '../../domains/user-availability.domain';

export class UserAvailabilityFactory {
  static default(): UserAvailabilityDomain {
    return {
      id: 'availability-1',
      course_id: '1',
      user_id: 'user-1',
      week_day: 1,
      start_time: '09:00:00',
      end_time: '10:00:00',
    };
  }
}
