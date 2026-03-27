import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  Min,
  Matches,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1000000000)
  @Transform(({ value }: { value: unknown }) => Number(value))
  phone?: number;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: unknown }) => new Date(value as string))
  birth_date?: Date;
}

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  @Length(6, 100)
  new_password: string;
}

export class CreateUserDto {
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
  @Transform(({ value }: { value: unknown }) => new Date(value as string))
  birth_date: Date;

  @IsOptional()
  @IsString()
  @Matches(/^(admin|client)$/, { message: 'El rol debe ser admin o client' })
  role?: string;
}

export class UpdateRoleDto {
  @IsString()
  @Matches(/^(admin|client)$/, { message: 'El rol debe ser admin o client' })
  role: string;
}
