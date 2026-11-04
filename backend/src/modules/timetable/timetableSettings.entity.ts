import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';

export interface TimePeriod {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

@Entity('timetable_settings')
export class TimetableSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ type: 'simple-json', nullable: true })
  studyDays!: string[];

  @Column({ type: 'simple-json', nullable: true })
  periods!: TimePeriod[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
