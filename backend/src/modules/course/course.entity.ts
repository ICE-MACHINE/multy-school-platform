import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, ManyToMany
} from 'typeorm';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ default: 30 })
  capacity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerSession!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerCourse!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerMonth!: number;

  @Column({ default: false })
  hasSessionOption!: boolean;

  @Column({ default: false })
  hasCourseOption!: boolean;

  @Column({ default: false })
  hasMonthOption!: boolean;

  @Column({ type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ type: 'int', nullable: true })
  numberOfSessions!: number | null;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ nullable: true })
  teacherId!: string;

  @ManyToOne(() => Teacher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher!: Teacher;

  @ManyToMany(() => Student, (student) => student.enrolledCourses)
  enrolledStudents!: Student[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}