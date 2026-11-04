import type { SchoolType } from './user.types';

export interface Classroom {
  id: string;
  name: string;
  schoolId: string;
  teacherId?: string;
  type: SchoolType;
  capacity: number;
  schedule?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  teacher?: { id: string; firstName: string; lastName: string };
  students?: { id: string; firstName: string; lastName: string; registrationNumber: string; isActive: boolean }[];
}

export interface CreateClassroomPayload {
  name: string;
  type: SchoolType;
  teacherId?: string;
  capacity: number;
  schedule?: string;
  description?: string;
}

export interface UpdateClassroomPayload {
  name?: string;
  teacherId?: string;
  capacity?: number;
  schedule?: string;
  description?: string;
}
