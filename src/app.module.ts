import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './services/products/products.module';
import { CartModule } from './services/cart/cart.module';
import { FavoritesModule } from './services/favorite/favorites.module';
import { AddressesModule } from './services/addresses/addresses.module';
import { OrdersModule } from './services/orders/orders.module';
import { UsersModule } from './services/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    AuthModule,
    ProductsModule,
    CartModule,
    FavoritesModule,
    AddressesModule,
    OrdersModule,
    UsersModule,

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASS ?? 'root',
      database: process.env.DB_NAME ?? 'sweetylust',
      autoLoadEntities: true,
      synchronize: true, // ⚠️ solo en desarrollo
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
