import { IsString } from 'class-validator';

export class confirmMobileDto {
  @IsString()
  paymentIntentId: string;
}
