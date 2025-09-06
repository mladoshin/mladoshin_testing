import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { CreateLessonRequestDto } from '@shared/types';

export class CreateLessonDto implements CreateLessonRequestDto{
  @IsUUID()
  @IsNotEmpty()
  course_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @IsInt()
  @Min(0)
  duration: number;
}
