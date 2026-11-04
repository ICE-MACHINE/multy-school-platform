import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { Student } from '../student/student.entity';
import { Activity } from './activity.entity';

@Entity('student_activity_participation')
@Unique(['activity', 'student'])
export class StudentActivityParticipation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  activityId!: string;

  @ManyToOne(() => Activity, (a) => a.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activityId' })
  activity!: Activity;

  @Column({ nullable: true })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ default: false })
  participated!: boolean;

  @Column({ type: 'int', nullable: true })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
