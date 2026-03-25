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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    const cart = await this.cartService.getActiveCart(req.user.id);
    const summary = await this.cartService.getCartSummary(req.user.id);

    return {
      cart,
      summary,
    };
  }

  @Post('add')
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    const cart = await this.cartService.addToCart(req.user.id, addToCartDto);
    const summary = await this.cartService.getCartSummary(req.user.id);

    return {
      message: 'Producto agregado al carrito',
      cart,
      summary,
    };
  }

  @Patch('item/:itemId')
  async updateCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateCartItem(
      req.user.id,
      +itemId,
      updateCartItemDto,
    );
    const summary = await this.cartService.getCartSummary(req.user.id);

    return {
      message: 'Carrito actualizado',
      cart,
      summary,
    };
  }

  @Delete('item/:itemId')
  async removeCartItem(@Request() req, @Param('itemId') itemId: string) {
    const cart = await this.cartService.removeCartItem(req.user.id, +itemId);
    const summary = await this.cartService.getCartSummary(req.user.id);

    return {
      message: 'Item eliminado del carrito',
      cart,
      summary,
    };
  }

  @Delete('clear')
  async clearCart(@Request() req) {
    await this.cartService.clearCart(req.user.id);

    return {
      message: 'Carrito vaciado correctamente',
    };
  }

  @Post('checkout')
  async checkout(@Request() req) {
    const cart = await this.cartService.checkout(req.user.id);

    return {
      message: 'Compra realizada con éxito',
      cart,
    };
  }

  @Get('summary')
  async getCartSummary(@Request() req) {
    return this.cartService.getCartSummary(req.user.id);
  }
}
