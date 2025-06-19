import { IGenerateUserScheduleDto } from '@shared/types';
import { IsUUID } from 'class-validator';

export class GenerateUserScheduleDto implements IGenerateUserScheduleDto {
  @IsUUID()
  course_id: string;
}
