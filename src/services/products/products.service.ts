import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Between,
  MoreThan,
} from 'typeorm';
import { Product } from './entities/product.entity';
import { Offer } from './entities/offer.entity';
import { OrderItem } from 'src/services/orders/entities/order-item.entity';
import { OfferType } from './entities/offer-type.enum';
import { ProductCategory } from './entities/product-category.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  // ── CRUD base ──────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto): Promise<Product> {
    try {
      const product = this.productRepository.create(dto);
      return await this.productRepository.save(product);
    } catch {
      throw new BadRequestException('Error al crear el producto');
    }
  }

  // ✅ findAll ahora acepta todos los filtros
  async findAll(filters: ProductFilters = {}) {
    const { search, category, minPrice, maxPrice, onSale, inStock } = filters;

    const where: FindOptionsWhere<Product> = {};

    if (search) where.title = Like(`%${search}%`);
    if (category) where.category = category;
    if (inStock) where.stock = MoreThan(0);

    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = Between(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      where.price = MoreThanOrEqual(minPrice);
    } else if (maxPrice !== undefined) {
      where.price = LessThanOrEqual(maxPrice);
    }

    let products = await this.productRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    if (onSale) {
      products = products.filter((p) => this.hasActiveOffer(p));
    }

    return {
      products: products.map((p) => this.attachOfferPrice(p)),
      total: products.length,
    };
  }

  // Devuelve todas las categorías disponibles con su conteo de productos
  async getCategories() {
    const result = await this.productRepository
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(p.id)', 'count')
      .groupBy('p.category')
      .orderBy('count', 'DESC')
      .getRawMany<{ category: ProductCategory; count: string }>();

    const withCount = Object.values(ProductCategory).map((cat) => {
      const found = result.find((r) => r.category === cat);
      return { category: cat, count: found ? parseInt(found.count) : 0 };
    });

    return withCount;
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    return this.attachOfferPrice(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    try {
      Object.assign(product, dto);
      return await this.productRepository.save(product);
    } catch {
      throw new BadRequestException('Error al actualizar el producto');
    }
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    if (product.stock + quantity < 0)
      throw new BadRequestException('Stock insuficiente');
    product.stock += quantity;
    return this.productRepository.save(product);
  }

  // ── Destacados ─────────────────────────────────────────────────────────────

  async getBestSellers(): Promise<Product[]> {
    const top = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select('oi.productId', 'productId')
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .groupBy('oi.productId')
      .orderBy('totalSold', 'DESC')
      .limit(3)
      .getRawMany<{ productId: number; totalSold: string }>();

    if (top.length === 0) return [];

    const ids = top.map((r) => r.productId);
    const products = await this.productRepository.findByIds(ids);

    return ids
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p)
      .map((p) => this.attachOfferPrice(p));
  }

  async getNewArrivals(): Promise<Product[]> {
    const products = await this.productRepository.find({
      order: { created_at: 'DESC' },
      take: 5,
    });
    return products.map((p) => this.attachOfferPrice(p));
  }

  async getProductsOnSale(): Promise<Product[]> {
    const now = new Date();
    const offers = await this.offerRepository.find({
      where: [
        {
          is_active: true,
          starts_at: LessThanOrEqual(now),
          ends_at: MoreThanOrEqual(now),
        },
        { is_active: true, starts_at: LessThanOrEqual(now), ends_at: IsNull() },
        { is_active: true, starts_at: IsNull(), ends_at: IsNull() },
      ],
      relations: ['product'],
    });

    return offers.map((o) => this.attachOfferPrice(o.product));
  }

  // ── Ofertas ────────────────────────────────────────────────────────────────

  async createOffer(productId: number, dto: CreateOfferDto): Promise<Offer> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const existing = await this.offerRepository.findOne({
      where: { productId, is_active: true },
    });
    if (existing)
      throw new ConflictException(
        'Este producto ya tiene una oferta activa. Desactívala antes de crear una nueva.',
      );

    this.validateOfferValues(dto);

    const offer = this.offerRepository.create({
      productId,
      type: dto.type,
      label: dto.label,
      discount_value: dto.discount_value ?? null,
      bundle_quantity: dto.bundle_quantity ?? null,
      is_active: dto.is_active ?? true,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
    });

    return this.offerRepository.save(offer);
  }

  async updateOffer(offerId: number, dto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('Oferta no encontrada');

    Object.assign(offer, {
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.discount_value !== undefined && {
        discount_value: dto.discount_value,
      }),
      ...(dto.bundle_quantity !== undefined && {
        bundle_quantity: dto.bundle_quantity,
      }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      ...(dto.starts_at !== undefined && {
        starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
      }),
      ...(dto.ends_at !== undefined && {
        ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
      }),
    });

    return this.offerRepository.save(offer);
  }

  async deactivateOffer(offerId: number): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('Oferta no encontrada');
    offer.is_active = false;
    return this.offerRepository.save(offer);
  }

  async removeOffer(offerId: number): Promise<{ message: string }> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('Oferta no encontrada');
    await this.offerRepository.remove(offer);
    return { message: 'Oferta eliminada' };
  }

  async getOffersByProduct(productId: number): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { productId },
      order: { created_at: 'DESC' },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private hasActiveOffer(product: Product): boolean {
    const offer = product.offer;
    if (!offer || !offer.is_active) return false;
    const now = new Date();
    const started = !offer.starts_at || offer.starts_at <= now;
    const notEnded = !offer.ends_at || offer.ends_at >= now;
    return started && notEnded;
  }

  private attachOfferPrice(
    product: Product,
  ): Product & { final_price?: number } {
    if (!this.hasActiveOffer(product)) return product;

    const offer = product.offer!;
    const price = Number(product.price);
    let final_price: number | undefined;

    switch (offer.type) {
      case OfferType.PERCENTAGE:
        final_price = parseFloat(
          (price * (1 - Number(offer.discount_value) / 100)).toFixed(2),
        );
        break;
      case OfferType.FIXED_PRICE:
        final_price = Number(offer.discount_value);
        break;
      case OfferType.TWO_FOR_ONE:
        final_price = price;
        break;
      case OfferType.BUNDLE:
        final_price = parseFloat(
          (
            Number(offer.discount_value) / Number(offer.bundle_quantity)
          ).toFixed(2),
        );
        break;
    }

    return { ...product, final_price };
  }

  private validateOfferValues(dto: CreateOfferDto): void {
    if (dto.type === OfferType.PERCENTAGE) {
      if (
        !dto.discount_value ||
        dto.discount_value <= 0 ||
        dto.discount_value >= 100
      )
        throw new BadRequestException('El porcentaje debe estar entre 1 y 99');
    }
    if (dto.type === OfferType.FIXED_PRICE && !dto.discount_value)
      throw new BadRequestException('El precio fijo es requerido');
    if (dto.type === OfferType.BUNDLE) {
      if (!dto.discount_value)
        throw new BadRequestException('El precio del bundle es requerido');
      if (!dto.bundle_quantity || dto.bundle_quantity < 2)
        throw new BadRequestException(
          'La cantidad del bundle debe ser mínimo 2',
        );
    }
  }
}
