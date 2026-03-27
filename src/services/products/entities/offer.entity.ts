import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { OfferType } from './offer-type.enum';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.offer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'enum', enum: OfferType })
  type: OfferType;

  @Column({ type: 'varchar', length: 200 })
  label: string;

  // Para PERCENTAGE: valor del 0 al 100
  // Para FIXED_PRICE: precio final
  // Para BUNDLE: precio del bundle
  // Para TWO_FOR_ONE: null
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount_value: number | null;

  // Para BUNDLE: cuántas unidades entran en el bundle
  @Column({ type: 'int', nullable: true })
  bundle_quantity: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // null = sin fecha de fin (liquidación permanente)
  @Column({ type: 'datetime', nullable: true })
  starts_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  ends_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
