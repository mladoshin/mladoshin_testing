import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { CourseResponse, IUserAvailabilityResponse } from '@shared/types';
import { UserAvailabilityDomain } from '../domains/user-availability.domain';
import { UserResponse } from 'src/modules/users/dto/user-response.dto';

export class UserAvailabilityResponse implements IUserAvailabilityResponse {
  id: string;
  user?: UserResponse | null;
  course?: CourseResponse | null;
  week_day: number;
  start_time: string;
  end_time: string;

  constructor(userAvailability: UserAvailabilityDomain) {
    const rest = instanceToPlain(userAvailability) as UserAvailabilityDomain;
    Object.assign(this, rest);
  }

  static make(
    userAvailability: UserAvailabilityDomain | null,
  ): UserAvailabilityResponse {
    if (!userAvailability) {
      throw new NotFoundException('Слот не найден');
    }

    return new UserAvailabilityResponse(userAvailability);
  }

  static collection(
    userAvailabilities: UserAvailabilityDomain[],
  ): UserAvailabilityResponse[] {
    return userAvailabilities.map(
      (userAvailability) => new UserAvailabilityResponse(userAvailability),
    );
  }
}
