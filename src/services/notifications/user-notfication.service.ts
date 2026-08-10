import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import {
  DeviceType,
  UserNotification,
} from './entities/user-notification.entity';

export interface RegisterDeviceDto {
  fcmToken: string;
  deviceType: DeviceType;
  deviceName?: string;
  osVersion?: string;
  deviceId?: string;
}

@Injectable()
export class UserNotificationService {
  private readonly logger = new Logger(UserNotificationService.name);

  constructor(
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
  ) {}

  /**
   * Registra o actualiza un dispositivo del usuario
   */
  async registerDevice(
    userId: number,
    dto: RegisterDeviceDto,
  ): Promise<UserNotification> {
    let userNotification = await this.userNotificationRepository.findOne({
      where: { fcmToken: dto.fcmToken },
    });

    if (userNotification) {
      userNotification.userId = userId;
      userNotification.deviceType = dto.deviceType;
      userNotification.deviceName = dto.deviceName ?? '';
      userNotification.osVersion = dto.osVersion ?? '';
      userNotification.deviceId = dto.deviceId ?? '';
      userNotification.isActive = 1;
      userNotification.isRevoked = 0;
      userNotification.lastUsedAt = new Date();
    } else {
      userNotification = new UserNotification();
      userNotification.userId = userId;
      userNotification.fcmToken = dto.fcmToken;
      userNotification.deviceType = dto.deviceType;
      userNotification.deviceName = dto.deviceName ?? '';
      userNotification.osVersion = dto.osVersion ?? '';
      userNotification.deviceId = dto.deviceId ?? '';
      userNotification.isActive = 1;
      userNotification.isRevoked = 0;
      userNotification.lastUsedAt = new Date();
    }

    await this.userNotificationRepository.save(userNotification);
    this.logger.log(`Device registered for user ${userId}: ${dto.deviceType}`);
    return userNotification;
  }

  /**
   * Desactiva un dispositivo específico
   */
  async disableDevice(fcmToken: string): Promise<void> {
    await this.userNotificationRepository.update({ fcmToken }, { isActive: 0 });
    this.logger.log(`Device disabled: ${fcmToken.substring(0, 20)}...`);
  }

  /**
   * Obtiene todos los dispositivos activos de un usuario
   */
  async getUserDevices(userId: number): Promise<UserNotification[]> {
    return this.userNotificationRepository.find({
      where: {
        userId,
        isActive: 1,
        isRevoked: 0,
      },
    });
  }

  /**
   * Obtiene todos los dispositivos de un usuario (incluyendo desactivados)
   */
  async getAllUserDevices(userId: number): Promise<UserNotification[]> {
    return this.userNotificationRepository.find({
      where: { userId },
    });
  }

  /**
   * Limpia tokens revocados
   */
  async cleanupRevokedTokens(): Promise<number> {
    const result = await this.userNotificationRepository.delete({
      isRevoked: 1,
    });

    this.logger.log(`Cleaned up ${result.affected} revoked tokens`);
    return result.affected || 0;
  }

  /**
   * Limpia dispositivos inactivos (no usados en X días)
   */
  async cleanupInactiveDevices(daysInactive: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await this.userNotificationRepository
      .createQueryBuilder()
      .update(UserNotification)
      .set({ isActive: 0 })
      .where('isActive = :isActive', { isActive: 1 })
      .andWhere(
        new Brackets((qb) => {
          qb.where('lastUsedAt < :date', { date: cutoffDate }).orWhere(
            'lastUsedAt IS NULL AND createdAt < :date',
            { date: cutoffDate },
          );
        }),
      )
      .execute();

    this.logger.log(
      `Disabled ${result.affected} inactive devices (older than ${daysInactive} days)`,
    );
    return result.affected || 0;
  }

  /**
   * Verifica si un token existe y está activo
   */
  async isTokenActive(fcmToken: string): Promise<boolean> {
    const token = await this.userNotificationRepository.findOne({
      where: {
        fcmToken,
        isActive: 1,
        isRevoked: 0,
      },
      select: ['id'],
    });

    return !!token;
  }

  /**
   * Obtiene estadísticas de dispositivos
   */
  async getDeviceStats(): Promise<{
    totalDevices: number;
    activeDevices: number;
    byPlatform: Record<string, number>;
  }> {
    const total = await this.userNotificationRepository.count();

    const active = await this.userNotificationRepository.count({
      where: { isActive: 1, isRevoked: 0 },
    });

    const byPlatform = await this.userNotificationRepository
      .createQueryBuilder('un')
      .select('un.deviceType', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('un.isActive = :isActive', { isActive: 1 })
      .andWhere('un.isRevoked = :isRevoked', { isRevoked: 0 })
      .groupBy('un.deviceType')
      .getRawMany();

    const platformStats: Record<string, number> = {};
    byPlatform.forEach((stat) => {
      platformStats[stat.platform] = parseInt(stat.count, 10);
    });

    return {
      totalDevices: total,
      activeDevices: active,
      byPlatform: platformStats,
    };
  }
}
