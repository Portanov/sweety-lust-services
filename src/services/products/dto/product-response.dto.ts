import { ProductCategory } from '../entities/product-category.enum';
import { OfferType } from '../entities/offer-type.enum';

export class OfferResponseDto {
  id: number;
  type: OfferType;
  label: string;
  discount_value: number | null;
  bundle_quantity: number | null;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
}

export class ProductResponseDto {
  id: number;
  title: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  category: ProductCategory;
  offer: OfferResponseDto | null;
  final_price?: number;
  created_at: Date;
  updated_at: Date;
}
