import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProductsModule } from '../products/products.module';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from '../common/encryption.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PublicOrdersController } from './publicorders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderTracking, OrderItem]),
    ProductsModule,
    ConfigModule,
    NotificationsModule,
  ],
  controllers: [PublicOrdersController, OrdersController],
  providers: [OrdersService, EncryptionService],
  exports: [OrdersService],
})
export class OrdersModule {}
