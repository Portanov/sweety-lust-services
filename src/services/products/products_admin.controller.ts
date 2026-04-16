import { Controller } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ProductsService } from './products.service';
import {
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { HttpStatus } from '@nestjs/common';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(+id, quantity);
  }

  @Post(':id/offers')
  createOffer(@Param('id') id: string, @Body() dto: CreateOfferDto) {
    return this.productsService.createOffer(+id, dto);
  }

  @Get(':id/offers')
  getOffersByProduct(@Param('id') id: string) {
    return this.productsService.getOffersByProduct(+id);
  }

  @Patch('offers/:offerId')
  updateOffer(@Param('offerId') offerId: string, @Body() dto: UpdateOfferDto) {
    return this.productsService.updateOffer(+offerId, dto);
  }

  @Patch('offers/:offerId/deactivate')
  deactivateOffer(@Param('offerId') offerId: string) {
    return this.productsService.deactivateOffer(+offerId);
  }

  @Delete('offers/:offerId')
  removeOffer(@Param('offerId') offerId: string) {
    return this.productsService.removeOffer(+offerId);
  }
}
