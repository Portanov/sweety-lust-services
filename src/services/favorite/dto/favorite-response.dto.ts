import { ProductResponseDto } from 'src/services/products/dto/product-response.dto';

export class FavoriteResponseDto {
  id: number;
  product_id: number;
  product: ProductResponseDto;
}
