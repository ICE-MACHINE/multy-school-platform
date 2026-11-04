import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { Surah } from './surah.entity';
import { QuranStatus, CompletionType, MemorizationType, Grade } from '../../shared/interfaces';

@Entity('quran_progress')
@Unique(['student', 'surah'])
export class QuranProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ nullable: true })
  surahId!: number;

  @ManyToOne(() => Surah, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surahId' })
  surah!: Surah;

  @Column({ type: 'enum', enum: ['not_reached', 'memorizing', 'memorized'], default: 'not_reached' })
  status!: QuranStatus;

  @Column({ type: 'enum', enum: ['full', 'partial'], nullable: true })
  completionType!: CompletionType;

  @Column({ type: 'int', nullable: true })
  lastAyah!: number;

  @Column({ type: 'enum', enum: ['speed', 'accuracy'], nullable: true })
  memorizationType!: MemorizationType;

  @Column({ type: 'enum', enum: ['good', 'very_good', 'excellent'], nullable: true })
  grade!: Grade;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @UpdateDateColumn()
  updatedAt!: Date;
}