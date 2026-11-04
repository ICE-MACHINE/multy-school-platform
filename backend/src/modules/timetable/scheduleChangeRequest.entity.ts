import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { TimetableSlot } from './timetableSlot.entity';
import type { ConstraintViolation } from './scheduling/constraintEngine';
import type { SuggestedAlternative } from './scheduling/optimizationEngine';

export interface AgentTraceStep {
  step: number;
  tool: string;
  permission: 'read:timetable' | 'compute:local' | 'external:meta-ai-anonymized' | 'write:timetable' | 'write:notification';
  status: 'ok' | 'skipped' | 'failed' | 'vetoed';
  summary: string;
  at: string;
  durationMs?: number;
}

@Entity('schedule_change_requests')
export class ScheduleChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ nullable: true })
  slotId!: string;

  @ManyToOne(() => TimetableSlot, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'slotId' })
  slot!: TimetableSlot;

  @Column({ nullable: true })
  requestedDay!: string;

  @Column({ nullable: true })
  requestedPeriodId!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  adminNote!: string;

  @Column({ type: 'enum', enum: ['approve', 'reject', 'manual_review'], nullable: true })
  aiDecision!: 'approve' | 'reject' | 'manual_review' | null;

  @Column({ type: 'float', nullable: true })
  aiConfidence!: number | null;

  @Column({ type: 'text', nullable: true })
  aiReason!: string | null;

  @Column({ type: 'datetime', nullable: true })
  aiProcessedAt!: Date | null;

  @Column({ default: false })
  autoProcessed!: boolean;

  @Column({ type: 'boolean', nullable: true })
  constraintFeasible!: boolean | null;

  @Column({ type: 'simple-json', nullable: true })
  constraintViolations!: ConstraintViolation[] | null;

  @Column({ type: 'simple-json', nullable: true })
  suggestedAlternatives!: SuggestedAlternative[] | null;

  @Column({ type: 'enum', enum: ['approve', 'reject', 'manual_review'], nullable: true })
  agentRecommendation!: 'approve' | 'reject' | 'manual_review' | null;

  @Column({ type: 'text', nullable: true })
  agentSummary!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  agentTrace!: AgentTraceStep[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
