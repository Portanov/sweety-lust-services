import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MaxLength(150)
  recipient_name: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  recipient_phone: string;

  @IsString()
  @MaxLength(200)
  street: string;

  @IsString()
  @MaxLength(20)
  ext_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  int_number?: string;

  @IsString()
  @MaxLength(150)
  neighborhood: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(100)
  state: string;

  @IsString()
  @Length(5, 5)
  postal_code: string;

  @IsOptional()
  @IsString()
  references?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateAddressDto extends CreateAddressDto {}
