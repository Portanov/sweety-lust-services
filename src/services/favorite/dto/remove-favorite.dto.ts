import { IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class RemoveFavoriteDto {
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  productId: number;
}
