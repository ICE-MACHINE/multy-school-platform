import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { NotificationType } from '../../shared/interfaces';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'enum', enum: ['absence', 'payment', 'general', 'message', 'activity', 'schedule_change'] })
  type!: NotificationType;

  @Column()
  recipientId!: string;

  @Column()
  recipientRole!: string;

  @Column()
  schoolId!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', default: 'medium' })
  priority!: string;

  @Column({ type: 'varchar', nullable: true })
  groupKey!: string | null;

  @Column({ nullable: true })
  link!: string;

  @CreateDateColumn()
  createdAt!: Date;
}