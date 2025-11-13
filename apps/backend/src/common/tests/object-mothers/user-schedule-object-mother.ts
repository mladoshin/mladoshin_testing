import { CreateUserScheduleDto } from 'src/modules/user-schedule/dto/create-user-schedule.dto';
import { GenerateUserScheduleDto } from 'src/modules/user-schedule/dto/generate-user-schedule.dto';
import { v4 as uuidv4 } from 'uuid';

export class UserScheduleObjectMother {
  static buildCreateDto(
    overrides?: Partial<CreateUserScheduleDto>,
  ): CreateUserScheduleDto {
    const dto: CreateUserScheduleDto = {
      course_id: uuidv4(),
      lesson_id: uuidv4(),
      duration: 60,
      start_time: '10:00:00',
      end_time: '11:00:00',
      scheduled_date: '2025-06-26',
      ...overrides,
    };

    return dto;
  }

  static buildCreateDtoArray(
    count: number,
    overrides?: Partial<CreateUserScheduleDto>,
  ): CreateUserScheduleDto[] {
    return Array.from({ length: count }, () =>
      UserScheduleObjectMother.buildCreateDto(overrides),
    );
  }

  static buildGenerateDto(
    overrides?: Partial<GenerateUserScheduleDto>,
  ): GenerateUserScheduleDto {
    const dto: GenerateUserScheduleDto = {
      course_id: uuidv4(),
      ...overrides,
    };

    return dto;
  }
}
