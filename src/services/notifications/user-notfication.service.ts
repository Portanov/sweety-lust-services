import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import {
    DeviceType,
    UserNotification,
} from './entities/user-notification.entity';

interface DevicePlatformStat {
    platform: string;
    count: string;
}

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
    ) { }

    /**
     * Registra o actualiza un dispositivo del usuario
     */
    async registerDevice(
        userId: number,
        dto: RegisterDeviceDto,
    ): Promise<UserNotification> {
        this.logger.log(`📱 Registering device for user ${userId}`);
        this.logger.log(`📱 DTO received: ${JSON.stringify(dto)}`);

        // Buscar si el token ya existe
        let userNotification = await this.userNotificationRepository.findOne({
            where: { fcmToken: dto.fcmToken },
        });

        if (userNotification) {
            userNotification.userId = userId;
            userNotification.deviceType = dto.deviceType;
            userNotification.deviceName =
                dto.deviceName ?? userNotification.deviceName ?? '';
            userNotification.osVersion =
                dto.osVersion ?? userNotification.osVersion ?? '';
            userNotification.deviceId =
                dto.deviceId ?? userNotification.deviceId ?? '';
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

        // Guardar en la base de datos
        const savedDevice =
            await this.userNotificationRepository.save(userNotification);
        this.logger.log(
            `✅ Device registered successfully: ${savedDevice.id} (${dto.deviceType})`,
        );

        return savedDevice;
    }

    /**
     * Desactiva un dispositivo específico
     */
    async disableDevice(fcmToken: string): Promise<void> {
        this.logger.log(`🔇 Disabling device: ${fcmToken.substring(0, 20)}...`);

        const result = await this.userNotificationRepository.update(
            { fcmToken },
            { isActive: 0 },
        );

        this.logger.log(`✅ Device disabled: ${result.affected} rows affected`);
    }

    /**
     * Obtiene todos los dispositivos activos de un usuario
     */
    async getUserDevices(userId: number): Promise<UserNotification[]> {
        this.logger.log(`📋 Getting active devices for user ${userId}`);

        const devices = await this.userNotificationRepository.find({
            where: {
                userId,
                isActive: 1,
                isRevoked: 0,
            },
            order: {
                lastUsedAt: 'DESC',
            },
        });

        this.logger.log(`📋 Found ${devices.length} active devices`);
        return devices;
    }

    /**
     * Obtiene todos los dispositivos de un usuario (incluyendo desactivados)
     */
    async getAllUserDevices(userId: number): Promise<UserNotification[]> {
        this.logger.log(`📋 Getting all devices for user ${userId}`);

        const devices = await this.userNotificationRepository.find({
            where: { userId },
            order: {
                createdAt: 'DESC',
            },
        });

        this.logger.log(`📋 Found ${devices.length} total devices`);
        return devices;
    }

    /**
     * Limpia tokens revocados
     */
    async cleanupRevokedTokens(): Promise<number> {
        this.logger.log('🧹 Cleaning up revoked tokens...');

        const result = await this.userNotificationRepository.delete({
            isRevoked: 1,
        });

        this.logger.log(`🧹 Cleaned up ${result.affected} revoked tokens`);
        return result.affected || 0;
    }

    /**
     * Limpia dispositivos inactivos (no usados en X días)
     */
    async cleanupInactiveDevices(daysInactive: number = 30): Promise<number> {
        this.logger.log(
            `🧹 Cleaning up inactive devices (${daysInactive} days)...`,
        );

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

        this.logger.log(`🧹 Disabled ${result.affected} inactive devices`);
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
        this.logger.log('📊 Getting device statistics...');

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
            .getRawMany<DevicePlatformStat>();

        const platformStats: Record<string, number> = {};
        byPlatform.forEach((stat) => {
            platformStats[stat.platform] = parseInt(stat.count, 10);
        });

        this.logger.log(
            `📊 Stats: ${total} total, ${active} active, ${Object.keys(platformStats).length} platforms`,
        );

        return {
            totalDevices: total,
            activeDevices: active,
            byPlatform: platformStats,
        };
    }

    /**
     * Reactiva un dispositivo desactivado
     */
    async reactivateDevice(fcmToken: string): Promise<boolean> {
        this.logger.log(`🔄 Reactivating device: ${fcmToken.substring(0, 20)}...`);

        const result = await this.userNotificationRepository.update(
            { fcmToken },
            {
                isActive: 1,
                isRevoked: 0,
                lastUsedAt: new Date(),
            },
        );

        const success = result.affected ? result.affected > 0 : false;
        this.logger.log(success ? '✅ Device reactivated' : '⚠️ Device not found');

        return success;
    }

    /**
     * Obtiene un dispositivo por su token
     */
    async getDeviceByToken(fcmToken: string): Promise<UserNotification | null> {
        return this.userNotificationRepository.findOne({
            where: { fcmToken },
        });
    }

    /**
     * Cuenta los dispositivos activos de un usuario
     */
    async countActiveDevices(userId: number): Promise<number> {
        return this.userNotificationRepository.count({
            where: {
                userId,
                isActive: 1,
                isRevoked: 0,
            },
        });
    }
}
