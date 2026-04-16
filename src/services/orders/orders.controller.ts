import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService, AddTrackingDto } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Rutas del usuario autenticado ─────────────────────────────────────────

  // Mis órdenes con productos
  @Get('my')
  getMyOrders(@Request() req: { user: { id: number } }) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  // Detalle de una de mis órdenes
  @Get('my/:id')
  getMyOrderDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.ordersService.getMyOrderDetail(id, req.user.id);
  }

  // Cancelar una de mis órdenes (solo si está en Procesando)
  @Patch('my/:id/cancel')
  cancelMyOrder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.ordersService.cancelMyOrder(id, req.user.id);
  }

  // ── Seguimiento público (sin auth) ────────────────────────────────────────
  @Get(':id/tracking')
  getPublicTracking(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getPublicTracking(id);
  }

  // ── Rutas de administración ───────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getOrderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderDetail(id);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  cancelOrderAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.cancelOrderAdmin(id);
  }

  @Patch(':id/tracking')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  addTracking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddTrackingDto,
  ) {
    return this.ordersService.addTracking(id, dto);
  }
}
