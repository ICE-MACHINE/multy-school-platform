import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';
import { SchoolAdmin } from '../schoolAdmin/schoolAdmin.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  month!: string;

  @Column({ type: 'date', nullable: true })
  sessionDate!: string;

  @Column({ nullable: true })
  courseName!: string;

  @Column({ type: 'enum', enum: ['month', 'course', 'session'], nullable: true })
  paymentType!: 'month' | 'course' | 'session' | null;

  @Column({ type: 'int', nullable: true })
  sessionNumber!: number | null;

  @Column({ nullable: true })
  courseId!: string | null;

  @ManyToOne(() => Course, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course!: Course | null;

  @Column({ nullable: true })
  studentId!: string | null;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student!: Student | null;

  @Column({ nullable: true })
  studentFullName!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ nullable: true })
  recordedById!: string | null;

  @ManyToOne(() => SchoolAdmin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: SchoolAdmin | null;

  @Column({ type: 'date' })
  paymentDate!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column()
  receiptNumber!: string;

  @Column({ type: 'boolean', default: false })
  refunded!: boolean;

  @Column({ type: 'date', nullable: true })
  refundedAt!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}