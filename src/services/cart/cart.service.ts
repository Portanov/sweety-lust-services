import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getActiveCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, status: CartStatus.ACTIVE },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        status: CartStatus.ACTIVE,
        total: 0,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Stock insuficiente');
    }

    const cart = await this.getActiveCart(userId);

    let cartItem = cart.items?.find((item) => item.productId === productId);

    if (cartItem) {
      cartItem.quantity += quantity;
      if (cartItem.quantity > product.stock) {
        throw new BadRequestException('Stock insuficiente');
      }
      cartItem.subtotal = cartItem.price * cartItem.quantity;
      await this.cartItemRepository.save(cartItem);
    } else {
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
        subtotal: product.price * quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    await this.updateCartTotal(cart.id);
    return this.getActiveCart(userId);
  }

  async updateCartItem(
    userId: number,
    itemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getActiveCart(userId);

    const cartItem = cart.items?.find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    const product = await this.productRepository.findOne({
      where: { id: cartItem.productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (updateCartItemDto.quantity > product.stock) {
      throw new BadRequestException('Stock insuficiente');
    }

    cartItem.quantity = updateCartItemDto.quantity;
    cartItem.subtotal = cartItem.price * cartItem.quantity;
    await this.cartItemRepository.save(cartItem);

    await this.updateCartTotal(cart.id);
    return this.getActiveCart(userId);
  }

  async removeCartItem(userId: number, itemId: number): Promise<Cart> {
    const cart = await this.getActiveCart(userId);

    const cartItem = cart.items?.find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    await this.cartItemRepository.remove(cartItem);
    await this.updateCartTotal(cart.id);
    return this.getActiveCart(userId);
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.getActiveCart(userId);

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.delete({ cartId: cart.id });
      cart.total = 0;
      await this.cartRepository.save(cart);
    }
  }

  private async updateCartTotal(cartId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (cart && cart.items) {
      const total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.total = total;
      await this.cartRepository.save(cart);
    }
  }

  async getCartSummary(userId: number): Promise<{
    items: any[];
    total: number;
    itemCount: number;
  }> {
    const cart = await this.getActiveCart(userId);

    const items = (cart.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }));

    return {
      items,
      total: cart.total,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  }

  async checkout(userId: number): Promise<Cart> {
    const cart = await this.getActiveCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    for (const item of cart.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product || product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto: ${item.product?.title || 'desconocido'}`,
        );
      }

      product.stock -= item.quantity;
      await this.productRepository.save(product);
    }

    cart.status = CartStatus.CHECKED_OUT;
    await this.cartRepository.save(cart);

    const newCart = this.cartRepository.create({
      userId,
      status: CartStatus.ACTIVE,
      total: 0,
      items: [],
    });
    await this.cartRepository.save(newCart);

    return cart;
  }
}
