import { IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateLessonDto {
    @IsUUID()
    @IsNotEmpty()
    course_id: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsDateString()
    date: string;
}
