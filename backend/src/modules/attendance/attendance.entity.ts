import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: ['morning', 'afternoon'], default: 'morning' })
  period!: 'morning' | 'afternoon';

  @Column({ default: false })
  isAbsent!: boolean;

  @Column({ default: false })
  justified!: boolean;

  @Column({ type: 'text', nullable: true })
  justification!: string;

  @Column({ nullable: true })
  studentId!: string | null;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student!: Student | null;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ nullable: true })
  recordedById!: string | null;

  @ManyToOne(() => Teacher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: Teacher | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}