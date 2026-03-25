import { IsInt, IsPositive, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddToCartDto {
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  productId: number;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  quantity: number;
}
