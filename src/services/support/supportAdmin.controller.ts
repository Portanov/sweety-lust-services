import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/auth/entities/user.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { SupportStatus } from './entities/support-status.enum';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SupportAdminController {
  constructor(private readonly supportService: SupportService) {}

  // GET /api/admin/support
  // GET /api/admin/support?search=vestido
  // GET /api/admin/support?status=review
  @Get('')
  getAll(
    @Query('search') search?: string,
    @Query('status') status?: SupportStatus,
  ) {
    return this.supportService.findAll({ search, status });
  }

  @Get('stats/daily-reports-current-month')
  getDailyReportsCurrentMonth() {
    return this.supportService.getDailyReportsCurrentMonth();
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.supportService.findOne(id);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generateReport(
    @Body() dto: CreateSupportDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.supportService.createAdmin(dto, req.user.id);
  }

  @Put('respond')
  updateReport(
    @Body() dto: UpdateSupportDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.supportService.update(dto, req.user.id);
  }

  @Delete(':id')
  deleteReport(@Param('id') id: number) {
    return this.supportService.deleteReport(id);
  }
}
