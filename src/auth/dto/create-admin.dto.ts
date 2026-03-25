import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAdminDto {
  @IsString()
  @MaxLength(100)
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @Length(6, 100)
  password: string;

  @IsInt()
  @Min(1000000000)
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsOptional()
  phone?: number;

  @IsDateString()
  @IsOptional()
  birth_date?: Date;
}
