import {
  IsDateString,
  IsEmail,
  IsInt,
  IsString,
  Length,
  MaxLength,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
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
  phone: number;

  @IsDateString()
  birth_date: Date;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
