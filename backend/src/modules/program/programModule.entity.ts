import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { Program } from './program.entity';
import { Lesson } from '../lesson/lesson.entity';

@Entity('program_modules')
export class ProgramModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ nullable: true })
  programId!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program!: Program;

  @OneToMany(() => Lesson, (lesson) => lesson.programModule)
  lessons!: Lesson[];

  @CreateDateColumn()
  createdAt!: Date;
}