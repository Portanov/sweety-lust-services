import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ProductCategory } from '../entities/product-category.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsEnum(ProductCategory, {
    message: `La categoría debe ser una de: ${Object.values(ProductCategory).join(', ')}`,
  })
  category?: ProductCategory;
}
