import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { School } from '../school/school.entity';

@Entity('school_admins')
@Unique(['phone', 'school'])
export class SchoolAdmin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  phone!: string;

  @Column()
  password!: string;

  @Column({ default: 'school_admin' })
  role!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  tokenVersion!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}