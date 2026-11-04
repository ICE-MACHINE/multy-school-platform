import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToOne, JoinColumn, Unique
} from 'typeorm';
import { School } from '../school/school.entity';
import { Classroom } from '../classroom/classroom.entity';
import { Gender } from '../../shared/interfaces';

@Entity('teachers')
@Unique(['phone', 'school'])
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  dateOfBirth!: string;

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

  @Column({ nullable: true })
  classroomId!: string;

  @OneToOne(() => Classroom, (classroom) => classroom.teacher, { nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom!: Classroom;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  tokenVersion!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}