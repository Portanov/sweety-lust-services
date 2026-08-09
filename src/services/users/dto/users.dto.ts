import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Column } from 'typeorm';

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
  @Column({ type: 'bigint', nullable: true })
  phone?: number;

  @IsOptional()
  @IsString()
  birth_date?: string;
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

  @Column({ type: 'bigint', nullable: true })
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
