import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, OneToOne, JoinColumn
} from 'typeorm';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: 30 })
  capacity!: number;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToOne(() => Teacher, (teacher) => teacher.classroom, { nullable: true })
  teacher!: Teacher;

  @OneToMany(() => Student, (student) => student.classroom)
  students!: Student[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}