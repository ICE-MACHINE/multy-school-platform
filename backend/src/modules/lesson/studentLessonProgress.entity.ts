import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { Student } from '../student/student.entity';
import { Lesson } from './lesson.entity';
import { LessonStatus } from '../../shared/interfaces';

@Entity('student_lesson_progress')
@Unique(['student', 'lesson'])
export class StudentLessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ nullable: true })
  lessonId!: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.studentProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson!: Lesson;

  @Column({ type: 'enum', enum: ['not_started', 'completed', 'absent'], default: 'not_started' })
  status!: LessonStatus;

  @Column({ type: 'date', nullable: true })
  completedAt!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}