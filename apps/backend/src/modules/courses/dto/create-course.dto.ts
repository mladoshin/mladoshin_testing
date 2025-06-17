import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber({allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2})
    @Min(0)
    price: number;

    @IsDateString()
    date_start: string;

    @IsDateString()
    date_finish: string;
}
