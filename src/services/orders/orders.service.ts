import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { OrderStatus } from './entities/order-status.enum';
import { Product } from '../products/entities/product.entity';
import { DeliveryAddress } from '../addresses/entities/delivery-address.entity';
import { EncryptionService } from '../common/encryption.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AddTrackingDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderTracking)
    private readonly trackingRepository: Repository<OrderTracking>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly encryption: EncryptionService,
  ) {}

  // ── Para el usuario ────────────────────────────────────────────────────────

  async getMyOrders(userId: number) {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product', 'address'],
      order: { created_at: 'DESC' },
    });

    return orders.map((o) => this.formatOrder(o));
  }

  async getMyOrderDetail(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'address', 'tracking'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId)
      throw new ForbiddenException('No tienes acceso a esta orden');

    return {
      ...this.formatOrder(order),
      tracking: order.tracking.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    };
  }

  // ── Seguimiento público ───────────────────────────────────────────────────

  async getPublicTracking(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['tracking'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    return {
      orderId: order.id,
      status: order.status,
      created_at: order.created_at,
      history: order.tracking.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    };
  }

  // ── Para administradores ──────────────────────────────────────────────────

  async getAllOrders() {
    const orders = await this.orderRepository.find({
      relations: ['items', 'items.product', 'address', 'user'],
      order: { created_at: 'DESC' },
    });
    return orders.map((o) => this.formatOrder(o));
  }

  async getOrderDetail(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'address', 'tracking', 'user'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    return {
      ...this.formatOrder(order),
      tracking: order.tracking.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    };
  }

  async addTracking(orderId: number, dto: AddTrackingDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const event = this.trackingRepository.create({
      orderId,
      status: dto.status,
      note: dto.note,
    });
    await this.trackingRepository.save(event);
    await this.orderRepository.update(orderId, { status: dto.status });

    return event;
  }

  // ── Cancelación ───────────────────────────────────────────────────────────

  private readonly NON_CANCELLABLE = [
    OrderStatus.ENVIADO,
    OrderStatus.EN_CAMINO,
    OrderStatus.ENTREGADO,
    OrderStatus.CANCELADO,
  ];

  async cancelMyOrder(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId)
      throw new ForbiddenException('No tienes acceso a esta orden');

    if (this.NON_CANCELLABLE.includes(order.status)) {
      throw new BadRequestException(
        `No se puede cancelar una orden con estado "${order.status}". Solo se pueden cancelar órdenes en estado Procesando.`,
      );
    }

    return this.applyCancel(order);
  }

  async cancelOrderAdmin(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === OrderStatus.ENTREGADO)
      throw new BadRequestException(
        'No se puede cancelar una orden ya entregada.',
      );
    if (order.status === OrderStatus.CANCELADO)
      throw new BadRequestException('La orden ya está cancelada.');

    return this.applyCancel(order);
  }

  private async applyCancel(order: Order) {
    for (const item of order.items) {
      await this.productRepository.increment(
        { id: item.productId },
        'stock',
        item.quantity,
      );
    }

    await this.orderRepository.update(order.id, {
      status: OrderStatus.CANCELADO,
    });

    await this.trackingRepository.save(
      this.trackingRepository.create({
        orderId: order.id,
        status: OrderStatus.CANCELADO,
        note: 'Orden cancelada',
      }),
    );

    return { message: 'Orden cancelada correctamente', orderId: order.id };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private decryptAddress(address: DeliveryAddress | null) {
    if (!address) return null;

    try {
      return {
        id: address.id,
        recipient_name: address.recipient_name,
        recipient_phone: this.encryption.decrypt(address.recipient_phone),
        street: this.encryption.decrypt(address.street),
        ext_number: this.encryption.decrypt(address.ext_number),
        int_number: address.int_number,
        neighborhood: this.encryption.decrypt(address.neighborhood),
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        references: address.references,
        is_default: address.is_default,
      };
    } catch {
      return {
        id: address.id,
        recipient_name: address.recipient_name,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        is_default: address.is_default,
      };
    }
  }

  private formatOrder(order: Order) {
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      address: this.decryptAddress(order.address ?? null),
      user: order.user
        ? {
            id: order.user.id,
            username: order.user.username,
            email: order.user.email,
          }
        : undefined,
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product: item.product,
      })),
    };
  }
}
