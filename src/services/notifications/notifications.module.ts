import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { FcmService } from './fmc.service';
import { UserNotificationService } from './user-notfication.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserNotification } from './entities/user-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserNotification])],
  providers: [UserNotificationService, FcmService],
  controllers: [NotificationsController],
  exports: [FcmService],
})
export class NotificationsModule {}
