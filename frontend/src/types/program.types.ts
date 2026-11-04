import type { SchoolType } from './user.types';
import type { Lesson } from './lesson.types';

export interface ProgramModule {
  id: string;
  title: string;
  orderIndex: number;
  programId?: string;
  lessons: Lesson[];
}

export interface Program {
  id: string;
  courseId: string;
  schoolId: string;
  teacherId: string;
  classroomId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: SchoolType;
  isActive: boolean;
  modules?: ProgramModule[];
  createdAt: string;
}

export interface ProgramWithModules extends Program {
  modules: ProgramModule[];
}

export interface CreateProgramPayload {
  courseId: string;
  classroomId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateProgramPayload {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}
