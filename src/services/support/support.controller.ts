import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SupportService } from './support.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { CreateSupportDto } from './dto/create-support.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('create')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  createReport(@Body() dto: CreateSupportDto) {
    return this.supportService.create(dto);
  }
}
