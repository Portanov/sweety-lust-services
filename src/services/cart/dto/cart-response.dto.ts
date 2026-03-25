import { ProductResponseDto } from '../../products/dto/product-response.dto';

export class CartItemResponseDto {
  id: number;
  productId: number;
  product: ProductResponseDto;
  quantity: number;
  price: number;
  subtotal: number;
}

export class CartResponseDto {
  id: number;
  items: CartItemResponseDto[];
  total: number;
  itemCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
