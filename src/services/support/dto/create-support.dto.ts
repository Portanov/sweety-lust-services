import { IsEmail, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class CreateSupportDto {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MaxLength(100)
  subject: string;

  @IsString()
  message: string;
}
