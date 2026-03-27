import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsInt,
  IsPositive,
  Min,
  Max,
  IsDateString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { OfferType } from '../entities/offer-type.enum';

export class CreateOfferDto {
  @IsEnum(OfferType)
  type: OfferType;

  @IsString()
  @MaxLength(200)
  label: string;

  @ValidateIf(
    (o: CreateOfferDto) =>
      o.type === OfferType.PERCENTAGE ||
      o.type === OfferType.FIXED_PRICE ||
      o.type === OfferType.BUNDLE,
  )
  @IsNumber()
  @IsPositive()
  discount_value?: number;

  // Requerido solo para BUNDLE (ej. 3 unidades por $100)
  @ValidateIf((o: CreateOfferDto) => o.type === OfferType.BUNDLE)
  @IsInt()
  @Min(2)
  bundle_quantity?: number;

  // PERCENTAGE: debe estar entre 1 y 99
  @ValidateIf((o: CreateOfferDto) => o.type === OfferType.PERCENTAGE)
  @Min(1)
  @Max(99)
  percentage_value?: number;

  @IsOptional()
  @IsDateString()
  starts_at?: string;

  // null = liquidación permanente
  @IsOptional()
  @IsDateString()
  ends_at?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  discount_value?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  bundle_quantity?: number;

  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @IsOptional()
  @IsDateString()
  ends_at?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
