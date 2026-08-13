import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './services/users/users.module';
import { AddressesModule } from './services/addresses/addresses.module';
import { OrdersModule } from './services/orders/orders.module';
import { CartModule } from './services/cart/cart.module';
import { CacheModule } from './services/common/cache/cache.module';
import { FavoritesModule } from './services/favorite/favorites.module';
import { NotificationsModule } from './services/notifications/notifications.module';
import { WebsocketModule } from './services/websocket/websocket.module';
import { SupportModule } from './services/support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASS ?? 'root',
      database: process.env.DB_NAME ?? 'sweetylust',
      autoLoadEntities: true,
      synchronize: true,
      extra: {
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 60000,
      },
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    AuthModule,
    UsersModule,
    AddressesModule,
    OrdersModule,
    CartModule,
    FavoritesModule,
    NotificationsModule,
    WebsocketModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
