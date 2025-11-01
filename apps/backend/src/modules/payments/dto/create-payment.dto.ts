import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}
