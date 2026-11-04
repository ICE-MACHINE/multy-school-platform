import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  teacherId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  parentId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  studentId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  adminId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ type: 'datetime', nullable: true })
  lastMessageAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}