import { CourseMapper } from '../courses/courses.mapper';
import { UsersMapper } from '../users/users.mapper';
import { UserAvailabilityDomain } from './domains/user-availability.domain';
import { UserAvailability } from './entities/user-availability.entity';

export class UserAvailabilityMapper {
  static toDomainEntity(
    userAvailability: UserAvailability,
  ): UserAvailabilityDomain {
    return {
      id: userAvailability.id,
      user: userAvailability.user ? UsersMapper.toDomainEntity(userAvailability.user) : null,
      course: userAvailability.course ? CourseMapper.toDomainEntity(userAvailability.course) : null,
      week_day: userAvailability.week_day,
      start_time: userAvailability.start_time,
      end_time: userAvailability.end_time,
    };
  }
}
