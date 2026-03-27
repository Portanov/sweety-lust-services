import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../entities/product.entity';
import { Offer } from '../entities/offer.entity';
import { OrderItem } from 'src/services/orders/entities/order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Offer, OrderItem])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
