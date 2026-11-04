import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, JoinColumn, JoinTable, Unique
} from 'typeorm';
import { Course } from '../course/course.entity';
import { Lesson } from '../lesson/lesson.entity';

/**
 * A session of a course, tracked so the teacher can mark it as completed
 * (with the lessons actually taught). Session-based ("بالحصة") payments are
 * only owed for completed sessions, so completion is the source of truth for
 * what a student must pay and what must be refunded on exit.
 */
@Entity('course_sessions')
@Unique(['courseId', 'sessionNumber'])
export class CourseSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;

  @Column({ type: 'int' })
  sessionNumber!: number;

  @Column({ type: 'date', nullable: true })
  completedAt!: string | null;

  @Column({ type: 'enum', enum: ['morning', 'afternoon'], default: 'morning' })
  period!: 'morning' | 'afternoon';

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @ManyToMany(() => Lesson, (lesson) => lesson.courseSessions)
  @JoinTable({
    name: 'course_session_lessons',
    joinColumn: { name: 'sessionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lessonId', referencedColumnName: 'id' },
  })
  lessons!: Lesson[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
