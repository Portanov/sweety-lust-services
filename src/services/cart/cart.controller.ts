import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req: { user: { id: number } }) {
    const cart = await this.cartService.getActiveCart(req.user.id);
    const summary = await this.cartService.getCartSummary(req.user.id);
    return { cart, summary };
  }

  @Get('summary')
  async getCartSummary(@Request() req: { user: { id: number } }) {
    return this.cartService.getCartSummary(req.user.id);
  }

  @Post('add')
  async addToCart(
    @Request() req: { user: { id: number } },
    @Body() addToCartDto: AddToCartDto,
  ) {
    const cart = await this.cartService.addToCart(req.user.id, addToCartDto);
    const summary = await this.cartService.getCartSummary(req.user.id);
    return { message: 'Producto agregado al carrito', cart, summary };
  }

  @Patch('item/:itemId')
  async updateCartItem(
    @Request() req: { user: { id: number } },
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateCartItem(
      req.user.id,
      +itemId,
      updateCartItemDto,
    );
    const summary = await this.cartService.getCartSummary(req.user.id);
    return { message: 'Carrito actualizado', cart, summary };
  }

  @Delete('item/:itemId')
  async removeCartItem(
    @Request() req: { user: { id: number } },
    @Param('itemId') itemId: string,
  ) {
    const cart = await this.cartService.removeCartItem(req.user.id, +itemId);
    const summary = await this.cartService.getCartSummary(req.user.id);
    return { message: 'Item eliminado del carrito', cart, summary };
  }

  @Delete('clear')
  async clearCart(@Request() req: { user: { id: number } }) {
    await this.cartService.clearCart(req.user.id);
    return { message: 'Carrito vaciado correctamente' };
  }

  @Post('checkout')
  async checkout(
    @Request() req: { user: { id: number } },
    @Body() checkoutDto: CheckoutDto,
  ) {
    const order = await this.cartService.checkout(req.user.id, checkoutDto);
    return {
      message: 'Compra realizada exitosamente',
      orderId: order.id,
      status: order.status,
      tracking: order.tracking,
    };
  }
}
