import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

@Entity('student_exemption_periods')
export class StudentExemptionPeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  studentId!: string;

  @ManyToOne(() => Student, (student) => student.exemptionPeriods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'datetime' })
  startDate!: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
