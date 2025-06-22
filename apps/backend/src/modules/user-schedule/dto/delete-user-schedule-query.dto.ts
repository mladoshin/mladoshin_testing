import { IsUUID } from 'class-validator';

export class DeleteUserScheduleQueryDto {
  @IsUUID()
  course_id: string;
}
