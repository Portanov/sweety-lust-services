import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateOfferDto, UpdateOfferDto } from '../dto/offer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── CRUD base ──────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search);
  }

  @Get('best-sellers')
  getBestSellers() {
    return this.productsService.getBestSellers();
  }

  @Get('new-arrivals')
  getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @Get('on-sale')
  getProductsOnSale() {
    return this.productsService.getProductsOnSale();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(+id, quantity);
  }

  // ── Ofertas (admin) ────────────────────────────────────────────────────────

  @Post(':id/offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createOffer(@Param('id') id: string, @Body() dto: CreateOfferDto) {
    return this.productsService.createOffer(+id, dto);
  }

  @Get(':id/offers')
  getOffersByProduct(@Param('id') id: string) {
    return this.productsService.getOffersByProduct(+id);
  }

  @Patch('offers/:offerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateOffer(@Param('offerId') offerId: string, @Body() dto: UpdateOfferDto) {
    return this.productsService.updateOffer(+offerId, dto);
  }

  @Patch('offers/:offerId/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivateOffer(@Param('offerId') offerId: string) {
    return this.productsService.deactivateOffer(+offerId);
  }

  @Delete('offers/:offerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeOffer(@Param('offerId') offerId: string) {
    return this.productsService.removeOffer(+offerId);
  }
}
