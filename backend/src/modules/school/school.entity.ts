import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { SuperAdmin } from '../superAdmin/superAdmin.entity';
import { SchoolType } from '../../shared/interfaces';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'enum', enum: ['quranic', 'private', 'kindergarten'] })
  type!: SchoolType;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyFee!: number;

  @Column({ default: 100 })
  maxUsers!: number;

  @Column({ default: 1000 })
  maxMessages!: number;

  @Column({ default: 0 })
  currentUsers!: number;

  @Column({ default: 0 })
  currentMessages!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isFrozen!: boolean;

  @Column({ nullable: true })
  createdById!: string;

  @ManyToOne(() => SuperAdmin, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: SuperAdmin;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}