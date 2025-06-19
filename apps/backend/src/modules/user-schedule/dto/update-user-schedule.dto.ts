import { PartialType } from '@nestjs/mapped-types';
import { GenerateUserScheduleDto } from './generate-user-schedule.dto';

export class UpdateUserAvailabilityDto extends PartialType(
  GenerateUserScheduleDto,
) {}
