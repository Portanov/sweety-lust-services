import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/auth/entities/user.entity';

@Entity('delivery_addresses')
export class DeliveryAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 150 })
  recipient_name: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 10 })
  postal_code: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  int_number: string;

  @Column({ type: 'text', nullable: true })
  references: string;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'blob' })
  recipient_phone: Buffer;

  @Column({ type: 'blob' })
  street: Buffer;

  @Column({ type: 'blob' })
  ext_number: Buffer;

  @Column({ type: 'blob' })
  neighborhood: Buffer;

  @CreateDateColumn()
  created_at: Date;
}
