import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique, ManyToMany, JoinTable, OneToMany
} from 'typeorm';
import { School } from '../school/school.entity';
import { Parent } from '../parent/parent.entity';
import { Classroom } from '../classroom/classroom.entity';
import { Course } from '../course/course.entity';
import { StudentExemptionPeriod } from './studentExemptionPeriod.entity';
import { Gender } from '../../shared/interfaces';

@Entity('students')
@Unique(['registrationNumber', 'school'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  registrationNumber!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  dateOfBirth!: string;

  @Column({ type: 'enum', enum: ['male', 'female'] })
  gender!: Gender;

  @Column({ type: 'text', nullable: true })
  healthStatus!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ nullable: true })
  parentId!: string;

  @ManyToOne(() => Parent, (parent) => parent.children, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent!: Parent;

  @Column({ nullable: true })
  classroomId!: string;

  @ManyToOne(() => Classroom, (classroom) => classroom.students, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom!: Classroom;

  @ManyToMany(() => Course, (course) => course.enrolledStudents)
  @JoinTable({
    name: 'student_courses',
    joinColumn: { name: 'studentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'courseId', referencedColumnName: 'id' },
  })
  enrolledCourses!: Course[];

  @Column({ type: 'int', nullable: true })
  quranCurrentSurahNumber!: number | null;

  @Column({ type: 'int', default: 0 })
  quranHizbs!: number;

  @Column({ default: false })
  isExemptFromPayment!: boolean;

  @OneToMany(() => StudentExemptionPeriod, (period) => period.student)
  exemptionPeriods!: StudentExemptionPeriod[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}