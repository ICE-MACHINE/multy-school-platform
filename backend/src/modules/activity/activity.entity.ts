import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Classroom } from '../classroom/classroom.entity';
import { StudentActivityParticipation } from './participation.entity';

export type ActivityCategory = 'physical' | 'creative' | 'cognitive' | 'social' | 'moral' | 'linguistic';
export type ActivityPeriod = 'morning' | 'afternoon';
export type ActivityStatus = 'planned' | 'completed';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'enum', enum: ['physical', 'creative', 'cognitive', 'social', 'moral', 'linguistic'], default: 'cognitive' })
  category!: ActivityCategory;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: ['morning', 'afternoon'], default: 'morning' })
  period!: ActivityPeriod;

  @Column({ type: 'enum', enum: ['planned', 'completed'], default: 'completed' })
  status!: ActivityStatus;

  @Column({ type: 'time', nullable: true })
  startTime!: string;

  @Column({ type: 'time', nullable: true })
  endTime!: string;

  @Column({ nullable: true })
  location!: string;

  @Column({ type: 'text', nullable: true })
  materials!: string;

  @Column({ default: true })
  isActive!: boolean;

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
  classroomId!: string;

  @ManyToOne(() => Classroom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom!: Classroom;

  @OneToMany(() => StudentActivityParticipation, (p) => p.activity, { cascade: true })
  participations!: StudentActivityParticipation[];

  @CreateDateColumn()
  createdAt!: Date;
}
