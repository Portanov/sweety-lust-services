import { IsInt, IsPositive } from 'class-validator';

export class CheckoutDto {
  @IsInt()
  @IsPositive()
  addressId: number;
}
