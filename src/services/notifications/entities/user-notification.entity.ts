import { User } from 'src/auth/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum DeviceType {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Entity('users_notifications')
@Index('idx_user_id_active', ['userId', 'isActive'])
@Index('idx_updated_at', ['updatedAt'])
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int', { name: 'user_id' })
  userId: number;

  @Column('varchar', { length: 255, unique: true })
  fcmToken: string;

  @Column('enum', { enum: DeviceType })
  deviceType: DeviceType;

  @Column('varchar', { length: 100, nullable: true })
  deviceName: string;

  @Column('varchar', { length: 50, nullable: true })
  osVersion: string;

  @Column('varchar', { length: 255, nullable: true })
  deviceId: string;

  @Column('tinyint', { default: 1 })
  isActive: number;

  @Column('tinyint', { default: 0 })
  isRevoked: number;

  @Column('timestamp', { nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
