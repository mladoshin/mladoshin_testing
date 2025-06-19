import { IsUUID } from 'class-validator';

export class GetUserAvailabilitiesQueryDto {
  @IsUUID()
  course_id: string;
}
