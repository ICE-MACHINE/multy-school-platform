import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('super_admins')
export class SuperAdmin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  phone!: string;

  @Column()
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  tokenVersion!: number;

  @Column({ default: false })
  mustChangePassword!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}