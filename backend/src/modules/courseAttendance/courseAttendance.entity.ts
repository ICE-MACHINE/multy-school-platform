import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { Course } from '../course/course.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Student } from '../student/student.entity';
import { School } from '../school/school.entity';

/**
 * Private-school attendance is per course: a student can be enrolled in
 * several courses at once, so being absent from one course on a given day
 * does NOT make them absent from the others that day.
 *
 * A record is created for each student whenever the teacher completes a
 * course session (which carries the lesson(s) taught that date/period).
 * The teacher then marks each student as حاضر / غائب, and either the
 * teacher or the school admin can justify (تبرير) an absence.
 */
@Entity('course_attendance')
@Unique(['courseId', 'sessionId', 'studentId'])
export class CourseAttendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;

  @Column({ type: 'varchar', nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => CourseSession, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session!: CourseSession | null;

  @Column({ type: 'varchar', nullable: true })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: ['morning', 'afternoon'], default: 'morning' })
  period!: 'morning' | 'afternoon';

  @Column({ default: false })
  isAbsent!: boolean;

  @Column({ default: false })
  justified!: boolean;

  @Column({ type: 'text', nullable: true })
  justification!: string;

  @Column({ type: 'varchar', nullable: true })
  recordedById!: string | null;

  @Column({ type: 'varchar', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
