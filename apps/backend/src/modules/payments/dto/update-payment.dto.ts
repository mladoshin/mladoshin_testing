import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}
