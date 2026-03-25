// src/cart/dto/update-cart-item.dto.ts
import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  quantity: number;
}
