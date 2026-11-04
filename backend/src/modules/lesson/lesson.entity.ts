import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, ManyToMany, JoinColumn
} from 'typeorm';
import { ProgramModule } from '../program/programModule.entity';
import { Course } from '../course/course.entity';
import { School } from '../school/school.entity';
import { StudentLessonProgress } from './studentLessonProgress.entity';
import { CourseSession } from '../courseSession/courseSession.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ nullable: true })
  programModuleId!: string;

  @ManyToOne(() => ProgramModule, (module) => module.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programModuleId' })
  programModule!: ProgramModule;

  @Column({ nullable: true })
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToMany(() => StudentLessonProgress, (progress) => progress.lesson)
  studentProgress!: StudentLessonProgress[];

  @ManyToMany(() => CourseSession, (session) => session.lessons)
  courseSessions!: CourseSession[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}