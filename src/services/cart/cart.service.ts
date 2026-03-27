import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderTracking } from '../orders/entities/order-tracking.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderTracking)
    private readonly trackingRepository: Repository<OrderTracking>,
  ) {}

  /** Obtiene el carrito activo del usuario */
  async getActiveCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId, total: 0, items: [] });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: number, dto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = dto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.stock < quantity)
      throw new BadRequestException('Stock insuficiente');

    const cart = await this.getActiveCart(userId);
    let cartItem = cart.items?.find((item) => item.productId === productId);

    if (cartItem) {
      cartItem.quantity += quantity;
      if (cartItem.quantity > product.stock) {
        throw new BadRequestException('Stock insuficiente');
      }
      cartItem.subtotal = Number(cartItem.price) * cartItem.quantity;
      await this.cartItemRepository.save(cartItem);
    } else {
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
        subtotal: Number(product.price) * quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    await this.updateCartTotal(cart.id);
    return this.getActiveCart(userId);
  }

  /** Actualiza los items del carrito */
  async updateCartItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getActiveCart(userId);
    const cartItem = cart.items?.find((item) => item.id === itemId);
    if (!cartItem)
      throw new NotFoundException('Item no encontrado en el carrito');

    const product = await this.productRepository.findOne({
      where: { id: cartItem.productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (dto.quantity > product.stock)
      throw new BadRequestException('Stock insuficiente');

    cartItem.quantity = dto.quantity;
    cartItem.subtotal = Number(cartItem.price) * cartItem.quantity;
    await this.cartItemRepository.save(cartItem);

    await this.updateCartTotal(cart.id);
    return this.getActiveCart(userId);
  }

  /** Elimina los elementos del carrito */
  async removeCartItem(userId: number, itemId: number): Promise<Cart> {
    const cart = await this.getActiveCart(userId);
    const cartItem = cart.items?.find((item) => item.id === itemId);
    if (!cartItem)
      throw new NotFoundException('Item no encontrado en el carrito');

    await this.cartItemRepository.remove(cartItem);
    await this.updateCartTotal(cart.id);
    return this.getActiveCart(userId);
  }

  /** Elimina todos los elementos del carrito */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.getActiveCart(userId);
    if (cart.items?.length > 0) {
      await this.cartItemRepository.delete({ cartId: cart.id });
      cart.total = 0;
      await this.cartRepository.save(cart);
    }
  }

  /** Hace la compra y descuenta el stock ademas vacia los items del carrito */
  async checkout(userId: number, dto: CheckoutDto): Promise<Order> {
    const cart = await this.getActiveCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    for (const item of cart.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (!product)
        throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.title ?? item.productId}"`,
        );
      }
    }

    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    const order = this.orderRepository.create({
      userId,
      addressId: dto.addressId,
      total,
      status: OrderStatus.PROCESANDO,
    });
    const savedOrder = await this.orderRepository.save(order);

    const orderItems = cart.items.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    await this.trackingRepository.save(
      this.trackingRepository.create({
        orderId: savedOrder.id,
        status: OrderStatus.PROCESANDO,
        note: 'Orden creada — pago recibido',
      }),
    );

    for (const item of cart.items) {
      await this.productRepository.decrement(
        { id: item.productId },
        'stock',
        item.quantity,
      );
    }

    await this.cartItemRepository.delete({ cartId: cart.id });
    cart.items = [];
    cart.total = 0;
    await this.cartRepository.save(cart);

    return this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'tracking'],
    }) as Promise<Order>;
  }

  /** Obtiene el total de productos en el carrito */
  async getCartSummary(userId: number) {
    const cart = await this.getActiveCart(userId);
    const items = cart.items ?? [];
    return {
      items,
      total: cart.total,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  }

  /** Actualiza el total del carrito */
  private async updateCartTotal(cartId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (cart?.items) {
      cart.total = cart.items.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0,
      );
      await this.cartRepository.save(cart);
    }
  }
}
