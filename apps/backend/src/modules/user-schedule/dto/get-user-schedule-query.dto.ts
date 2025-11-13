import { IsUUID } from 'class-validator';

export class GetUserScheduleQueryDto {
  @IsUUID()
  course_id: string;
}
