import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonDto } from './create-lesson.dto';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
    @IsOptional()
        @IsString()
        @IsNotEmpty()
        title?: string;
    
        @IsOptional()
        @IsString()
        @IsNotEmpty()
        content?: string;
    
        @IsOptional()
        @IsDateString()
        date?: string;
}
