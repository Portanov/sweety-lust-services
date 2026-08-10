import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  DeviceType,
  UserNotification,
} from './entities/user-notification.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FcmService, NotificationPayload } from './fmc.service';
import { UserNotificationService } from './user-notfication.service';

class RegisterDeviceDto {
  fcmToken: string;
  deviceType: DeviceType;
  deviceName?: string;
  osVersion?: string;
  deviceId?: string;
}

class SendTestNotificationDto {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Registra un nuevo dispositivo para recibir notificaciones
   * POST /notifications/register-device
   */
  @Post('register-device')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @Body() dto: RegisterDeviceDto,
    @Req() req,
  ): Promise<{ message: string; device: UserNotification }> {
    const userId = req.user.id;

    const device = await this.userNotificationService.registerDevice(
      userId,
      dto,
    );

    return {
      message: 'Device registered successfully',
      device,
    };
  }

  /**
   * Obtiene todos los dispositivos activos del usuario
   * GET /notifications/devices
   */
  @Get('devices')
  async getUserDevices(@Req() req): Promise<{
    devices: UserNotification[];
    count: number;
  }> {
    const userId = req.user.id;
    const devices = await this.userNotificationService.getUserDevices(userId);

    return {
      devices,
      count: devices.length,
    };
  }

  /**
   * Desactiva un dispositivo específico
   * DELETE /notifications/devices/:fcmToken
   */
  @Delete('devices/:fcmToken')
  @HttpCode(HttpStatus.OK)
  async disableDevice(@Param('fcmToken') fcmToken: string): Promise<{
    message: string;
  }> {
    await this.userNotificationService.disableDevice(fcmToken);

    return {
      message: 'Device disabled successfully',
    };
  }

  /**
   * Envía una notificación de prueba al usuario actual
   * POST /notifications/send-test
   * (Solo para desarrollo/testing)
   */
  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(
    @Body() dto: SendTestNotificationDto,
    @Req() req,
  ): Promise<{ message: string; result: any }> {
    const userId = req.user.id;

    const payload: NotificationPayload = {
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
    };

    const result = await this.fcmService.sendNotificationToUser(
      userId,
      payload,
    );

    return {
      message: 'Test notification sent',
      result,
    };
  }

  /**
   * Obtiene estadísticas de dispositivos (ADMIN ONLY - opcional)
   * GET /notifications/stats
   */
  @Get('stats')
  async getStats(): Promise<any> {
    const stats = await this.userNotificationService.getDeviceStats();
    return stats;
  }
}
