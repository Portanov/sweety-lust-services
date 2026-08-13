import { IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { Action } from '../entities/support-status.enum';

export class CreateChangelogDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNumber()
  @IsPositive()
  reportId: number;

  @IsEnum(Action)
  action: Action;

  @IsString()
  description: string;
}
