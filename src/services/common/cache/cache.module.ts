import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`;

        const keyv = new Keyv({
          store: new KeyvRedis(redisUrl),
          ttl: configService.get('CACHE_TTL', 5 * 60 * 1000),
          namespace: 'sweetylust',
        });

        keyv.on('error', (err) => {
          console.error('Redis Cache Error:', err);
        });

        return {
          store: keyv,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
