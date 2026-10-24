import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Support } from './entities/support.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateSupportDto } from './dto/create-support.dto';
import { Changelog } from './entities/changelog.entity';
import { UpdateSupportDto } from './dto/update-support.dto';
import { CreateChangelogDto } from './dto/create-changelog.dto';
import { Action, SupportFilters } from './entities/support-status.enum';
import Fuse from 'fuse.js';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
    @InjectRepository(Changelog)
    private readonly changelogRepository: Repository<Changelog>,
  ) {}

  async create(dto: CreateSupportDto): Promise<boolean> {
    try {
      const report = this.supportRepository.create(dto);
      const result = await this.supportRepository.save(report);
      return !!result;
    } catch {
      throw new BadRequestException('Error al crear el reporte');
    }
  }

  async findOne(id: number): Promise<Support> {
    const report = await this.supportRepository.findOne({
      where: { id, active: true },
    });
    if (!report)
      throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
    return report;
  }

  // -------------------------------
  // Rutas Admin (Soporte)
  // -------------------------------

  async findAll(filters: SupportFilters = {}) {
    const { search, status } = filters;
    const where: FindOptionsWhere<Support> = { active: true };

    if (status) where.status = status;

    let reports = await this.supportRepository.find({ where });

    if (search?.trim()) {
      const fuse = new Fuse(reports, {
        keys: [
          {
            name: 'subject',
            weight: 0.4,
          },
          {
            name: 'name',
            weight: 0.3,
          },
          {
            name: 'email',
            weight: 0.25,
          },
          {
            name: 'phone',
            weight: 0.05,
          },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
      });

      reports = fuse.search(search).map((result) => result.item);
    }

    return { reports, total: reports.length };
  }

  async update(dto: UpdateSupportDto, userId: number): Promise<boolean> {
    const report = await this.findOne(dto.reportId);
    try {
      report.status = dto.status;
      const result = await this.supportRepository.save(report);
      if (result) {
        const request = {
          userId: userId,
          reportId: report.id,
          action: Action.UPDATE,
          description: `Se ha cambiado el status a ${dto.status}`,
        };
        await this.createChangelog(request);
        return true;
      }
      return false;
    } catch {
      throw new BadRequestException('Error al actualizar el reporte');
    }
  }

  async createAdmin(dto: CreateSupportDto, userId: number): Promise<boolean> {
    try {
      const report = this.supportRepository.create(dto);
      const result = await this.supportRepository.save(report);
      if (result) {
        const request = {
          userId: userId,
          reportId: result.id,
          action: Action.UPDATE,
          description: `Se ha creado el reporte con el id ${result.id}`,
        };
        await this.createChangelog(request);
        return true;
      }
      return false;
    } catch {
      throw new BadRequestException('Error al crear el reporte');
    }
  }

  async createChangelog(dto: CreateChangelogDto) {
    try {
      const report = this.changelogRepository.create(dto);
      return await this.changelogRepository.save(report);
    } catch {
      throw new BadRequestException('Error al crear el reporte');
    }
  }

  async deleteReport(id: number) {
    try {
      const report = await this.findOne(id);
      report.active = false;
      const result = await this.supportRepository.save(report);
      return !!result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Error al borrar el reporte');
    }
  }

  async getDailyReportsCurrentMonth() {
    const { startDate, endDate } = this.getCurrentMonthRange();

    const reports = await this.supportRepository
      .createQueryBuilder('support')
      .select('support.created_at', 'created_at')
      .where('support.active = :active', { active: true })
      .andWhere('support.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('support.created_at', 'ASC')
      .getRawMany<{ created_at: string | Date }>();

    const totalsByDay = new Map<string, number>();
    for (const report of reports) {
      const day = this.extractDayKey(report.created_at);
      totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + 1);
    }

    return this.buildDailyRange(startDate, endDate).map((day) => ({
      day,
      reportsCount: totalsByDay.get(day) ?? 0,
    }));
  }

  private getCurrentMonthRange() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private formatDateOnly(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extractDayKey(dateValue: string | Date) {
    if (dateValue instanceof Date) {
      return dateValue.toISOString().slice(0, 10);
    }

    return String(dateValue).slice(0, 10);
  }

  private buildDailyRange(startDate: Date, endDate: Date) {
    const dates: string[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
      dates.push(this.formatDateOnly(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }
}
