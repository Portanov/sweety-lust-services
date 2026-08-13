import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { Support } from './entities/support.entity';
import { SupportAdminController } from './supportAdmin.controller';
import { Changelog } from './entities/changelog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Support, Changelog])],
  providers: [SupportService],
  controllers: [SupportAdminController, SupportController],
  exports: [TypeOrmModule, SupportService],
})
export class SupportModule {}
