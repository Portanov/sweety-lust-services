import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductCategory } from './entities/product-category.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/products
  // GET /api/products?search=vestido
  // GET /api/products?category=ropa
  // GET /api/products?minPrice=100&maxPrice=500
  // GET /api/products?onSale=true
  // GET /api/products?inStock=true
  // GET /api/products?category=ropa&minPrice=100&onSale=true  (combinados)
  @Get()
  @Public()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: ProductCategory,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('onSale') onSale?: string,
    @Query('inStock') inStock?: string,
  ) {
    return this.productsService.findAll({
      search,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      onSale: onSale === 'true',
      inStock: inStock === 'true',
    });
  }

  // Devuelve todas las categorías con su conteo de productos
  // GET /api/products/categories
  @Get('categories')
  @Public()
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('best-sellers')
  @Public()
  getBestSellers() {
    return this.productsService.getBestSellers();
  }

  @Get('new-arrivals')
  @Public()
  getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @Get('on-sale')
  @Public()
  getProductsOnSale() {
    return this.productsService.getProductsOnSale();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }
}
