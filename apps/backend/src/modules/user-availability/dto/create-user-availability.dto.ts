import { ICreateUserAvailabilityDto } from '@shared/types';
import { IsInt, IsMilitaryTime, Min, Max, IsUUID } from 'class-validator';

export class CreateUserAvailabilityDto implements ICreateUserAvailabilityDto {
  @IsUUID()
  course_id: string;

  @IsInt()
  @Min(0)
  @Max(6)
  week_day: number; // 0 — воскресенье, 6 — суббота

  @IsMilitaryTime()
  start_time: string; // 'HH:mm:ss' format

  @IsMilitaryTime()
  end_time: string; // 'HH:mm:ss' format
}
