import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Messaging,
  Message,
  MulticastMessage,
  TokenMessage,
  TopicMessage,
} from 'firebase-admin/messaging';
import { getMessagingInstance, initializeFirebase } from 'src/firebase.config';
import { UserNotification } from './entities/user-notification.entity';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>; // Datos adicionales (JSON debe ser string)
  badge?: string;
  sound?: string;
  android?: {
    priority?: 'high' | 'normal';
    ttl?: number;
    tag?: string;
    color?: string;
  };
  webpush?: {
    icon?: string;
    badge?: string;
    tag?: string;
  };
  apns?: {
    headers?: Record<string, string>;
    payload?: {
      aps?: {
        sound?: string;
        badge?: number;
        'mutable-content'?: number;
      };
    };
  };
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private messaging: Messaging;

  constructor(
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
  ) {
    initializeFirebase();
    this.messaging = getMessagingInstance();
  }

  /**
   * Envía una notificación a un usuario específico
   */
  async sendNotificationToUser(
    userId: number,
    payload: NotificationPayload,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const devices = await this.userNotificationRepository.find({
      where: {
        userId,
        isActive: 1,
        isRevoked: 0,
      },
    });

    if (devices.length === 0) {
      this.logger.warn(`No active devices found for user ${userId}`);
      return { success: 0, failed: 0, errors: ['No active devices'] };
    }

    return this.sendToMultipleDevices(devices, payload);
  }

  /**
   * Envía notificación a múltiples dispositivos (Soporta más de 500 dispositivos)
   */
  async sendToMultipleDevices(
    devices: UserNotification[],
    payload: NotificationPayload,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!devices || devices.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    const messagePayload = this.buildMessage(payload);
    let successCount = 0;
    const failedTokens: string[] = [];
    const errors: string[] = [];
    const devicesToUpdate: UserNotification[] = [];

    const MAX_TOKENS_PER_BATCH = 500;

    for (let i = 0; i < devices.length; i += MAX_TOKENS_PER_BATCH) {
      const chunkDevices = devices.slice(i, i + MAX_TOKENS_PER_BATCH);
      const tokens = chunkDevices.map((d) => d.fcmToken);

      const message: MulticastMessage = {
        tokens,
        ...messagePayload,
      };

      try {
        const response = await this.messaging.sendEachForMulticast(message);

        response.responses.forEach((result, index) => {
          const device = chunkDevices[index];
          let needsUpdate = false;

          if (result.success) {
            successCount++;
            device.lastUsedAt = new Date();
            needsUpdate = true;
          } else {
            failedTokens.push(tokens[index]);
            errors.push(result.error?.message || 'Unknown error');
            if (
              result.error?.code === 'messaging/invalid-registration-token' ||
              result.error?.code ===
                'messaging/registration-token-not-registered'
            ) {
              device.isRevoked = 1;
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            devicesToUpdate.push(device);
          }
        });
      } catch (error) {
        this.logger.error(
          `Error sending chunk ${i / MAX_TOKENS_PER_BATCH + 1}:`,
          error,
        );
      }
    }

    if (devicesToUpdate.length > 0) {
      await this.userNotificationRepository.save(devicesToUpdate);
    }

    this.logger.log(
      `Multicast complete: ${successCount} success, ${failedTokens.length} failed`,
    );

    return {
      success: successCount,
      failed: failedTokens.length,
      errors,
    };
  }

  /**
   * Envía a un FCM token específico (para debugging)
   */
  async sendToToken(
    fcmToken: string,
    payload: NotificationPayload,
  ): Promise<string> {
    const messagePayload = this.buildMessage(payload);

    const message: TokenMessage = {
      token: fcmToken,
      ...messagePayload,
    };

    try {
      const messageId = await this.messaging.send(message);
      this.logger.log(`Notification sent with ID: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error('Error sending notification to token:', error);
      throw error;
    }
  }

  /**
   * Envía a un tema (topic subscription)
   */
  async sendToTopic(
    topic: string,
    payload: NotificationPayload,
  ): Promise<string> {
    const messagePayload = this.buildMessage(payload);

    const message: TopicMessage = {
      topic,
      ...messagePayload,
    };

    try {
      const messageId = await this.messaging.send(message);

      this.logger.log(
        `Notification sent to topic '${topic}' with ID: ${messageId}`,
      );
      return messageId;
    } catch (error) {
      this.logger.error('Error sending notification to topic:', error);
      throw error;
    }
  }

  /**
   * Construye la base del mensaje para Firebase excluyendo el destino (token/topic)
   */
  private buildMessage(
    payload: NotificationPayload,
  ): Omit<Message, 'token' | 'topic' | 'condition'> {
    return {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          icon: payload.webpush?.icon || 'https://your-app.com/logo.png',
          badge: payload.webpush?.badge || 'https://your-app.com/badge.png',
        },
        ...payload.webpush,
      },
      android: {
        priority: payload.android?.priority || 'high',
        ttl: payload.android?.ttl || 86400,
        ...payload.android,
      },
      apns: {
        headers: {
          'apns-priority': '10',
          ...payload.apns?.headers,
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'mutable-content': 1,
            ...payload.apns?.payload?.aps,
          },
        },
      },
    };
  }

  /**
   * Suscribe un token a un tema
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await this.messaging.subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
    } catch (error) {
      this.logger.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Desuscribe un token de un tema
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await this.messaging.unsubscribeFromTopic(tokens, topic);
      this.logger.log(
        `Unsubscribed ${tokens.length} tokens from topic: ${topic}`,
      );
    } catch (error) {
      this.logger.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }
}
