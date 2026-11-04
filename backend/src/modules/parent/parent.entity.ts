import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique, OneToMany
} from 'typeorm';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { Gender } from '../../shared/interfaces';

@Entity('parents')
@Unique(['phone', 'school'])
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  placeOfResidence!: string;

  @Column({ type: 'enum', enum: ['male', 'female'] })
  gender!: Gender;

  @Column()
  phone!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => Student, (student) => student.parent)
  children!: Student[];

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  tokenVersion!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}