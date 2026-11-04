import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';

export type AiRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AiPredictionSource = 'meta' | 'heuristic';

@Entity('ai_predictions')
export class AiPrediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ nullable: true })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'] })
  riskLevel!: AiRiskLevel;

  @Column({ type: 'float' })
  successProbability!: number;

  @Column({ type: 'float' })
  attendanceRate!: number;

  @Column({ type: 'int' })
  totalAbsences!: number;

  @Column({ type: 'int' })
  unjustifiedAbsences!: number;

  @Column({ type: 'int' })
  missedLessons!: number;

  @Column({ type: 'int' })
  completedLessons!: number;

  @Column({ type: 'simple-json', nullable: true })
  factors!: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  recommendations!: string[] | null;

  @Column({ type: 'text', nullable: true })
  parentSummary!: string | null;

  @Column({ type: 'enum', enum: ['meta', 'heuristic'] })
  source!: AiPredictionSource;

  @Column({ type: 'varchar', nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', default: 'en' })
  locale!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
