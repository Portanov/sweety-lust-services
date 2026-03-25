import { IsString, IsNumber, Min, MaxLength, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsUrl()
  image: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  stock: number;
}
