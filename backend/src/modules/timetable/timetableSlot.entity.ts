import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Course } from '../course/course.entity';
import { Activity } from '../activity/activity.entity';
import { Classroom } from '../classroom/classroom.entity';

@Entity('timetable_slots')
export class TimetableSlot {
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

  @Column()
  day!: string;

  @Column({ nullable: true })
  periodId!: string;

  @Column({ type: 'enum', enum: ['course', 'activity', 'classroom'], default: 'course' })
  type!: 'course' | 'activity' | 'classroom';

  @Column({ nullable: true })
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course!: Course;

  @Column({ nullable: true })
  activityId!: string;

  @ManyToOne(() => Activity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'activityId' })
  activity!: Activity;

  @Column({ nullable: true })
  classroomId!: string;

  @ManyToOne(() => Classroom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom!: Classroom;

  @Column({ type: 'date', nullable: true })
  startDate!: string;

  @Column({ type: 'varchar', length: 5, default: '08:00' })
  startTime!: string;

  @Column({ type: 'int', default: 60 })
  duration!: number;

  @Column({ default: '#6366f1' })
  color!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
