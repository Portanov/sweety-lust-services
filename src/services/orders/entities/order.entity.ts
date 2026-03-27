import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { DeliveryAddress } from '../../addresses/entities/delivery-address.entity';
import { OrderTracking } from './order-tracking.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'address_id' })
  addressId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PROCESANDO })
  status: OrderStatus;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => DeliveryAddress, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'address_id' })
  address: DeliveryAddress;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderTracking, (tracking) => tracking.order)
  tracking: OrderTracking[];

  @CreateDateColumn()
  created_at: Date;
}
