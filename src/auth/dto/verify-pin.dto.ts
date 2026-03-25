import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyPinDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  pin: string;

  @IsString()
  temp_token: string;
}
