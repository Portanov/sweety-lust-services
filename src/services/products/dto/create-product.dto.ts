import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductCategory } from '../entities/product-category.enum';

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
  @Transform(({ value }: { value: unknown }) => parseFloat(value as string))
  price: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }: { value: unknown }) => parseInt(value as string))
  stock: number;

  @IsOptional()
  @IsEnum(ProductCategory, {
    message: `La categoría debe ser una de: ${Object.values(ProductCategory).join(', ')}`,
  })
  category?: ProductCategory;
}
