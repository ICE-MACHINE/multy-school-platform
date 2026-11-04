import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index
} from 'typeorm';
import { SenderType } from '../../shared/interfaces';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'enum', enum: ['teacher', 'parent', 'school_admin'] })
  senderType!: SenderType;

  @Column({ type: 'varchar', length: 255 })
  senderId!: string;

  @Column({ type: 'varchar', length: 255 })
  receiverId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  studentId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  schoolId!: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  conversationId!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}