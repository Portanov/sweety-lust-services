import { IsInt, IsPositive } from 'class-validator';

export class confirmMobileDto {
  @IsInt()
  @IsPositive()
  paymentIntentId: number;
}
