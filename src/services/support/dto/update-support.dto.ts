import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { SupportStatus } from '../entities/support-status.enum';

export class UpdateSupportDto {
  @IsNumber()
  @IsPositive()
  reportId: number;

  @IsEnum(SupportStatus, {
    message: `La categoría debe ser una de: ${Object.values(SupportStatus).join(', ')}`,
  })
  status: SupportStatus;
}
