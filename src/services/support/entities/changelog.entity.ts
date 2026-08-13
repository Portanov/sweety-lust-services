import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Action } from './support-status.enum';

@Entity('changelogs')
export class Changelog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  report: number;

  @Column({ type: 'simple-enum', enum: Action })
  action: Action;

  @Column({ type: 'text' })
  description: string;
}
