import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('ordersp')
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Get(':id/tracking')
  getPublicTracking(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getPublicTracking(id);
  }

  @Get(':id/products')
  getPublicProducts(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderPackingProducts(id);
  }

  @Get(':id/finish-packing')
  finishPacking(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.markAsConfirmed(id);
  }
}
