import { CreateUserAvailabilityDto } from 'src/modules/user-availability/dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from 'src/modules/user-availability/dto/update-user-availability.dto';
import { v4 as uuidv4 } from 'uuid';

export class UserAvailabilityObjectMother {
  static buildCreateDto(
    overrides?: Partial<CreateUserAvailabilityDto>,
  ): CreateUserAvailabilityDto {
    const dto: CreateUserAvailabilityDto = {
      course_id: uuidv4(),
      week_day: 1, // Понедельник
      start_time: '09:00',
      end_time: '17:00',
      ...overrides,
    };

    return dto;
  }

  static buildUpdateDto(
    overrides?: Partial<UpdateUserAvailabilityDto>,
  ): UpdateUserAvailabilityDto {
    const dto: UpdateUserAvailabilityDto = {
      week_day: 2,
      start_time: '10:00',
      end_time: '18:00',
      ...overrides,
    };

    return dto;
  }
}
