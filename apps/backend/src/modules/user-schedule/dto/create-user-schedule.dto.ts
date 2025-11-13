import { ICreateUserScheduleDto } from '@shared/types';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsMilitaryTime, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateUserScheduleArrayDto {
  @ValidateNested({ each: true })
  @Type(() => CreateUserScheduleDto)
  data: CreateUserScheduleDto[];
}

export class CreateUserScheduleDto implements ICreateUserScheduleDto {
  @IsUUID()
  course_id: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsMilitaryTime()
  start_time: string;

  @IsMilitaryTime()
  end_time: string;

  @IsUUID()
  lesson_id: string;

  @IsDateString()
  scheduled_date: string;
}
