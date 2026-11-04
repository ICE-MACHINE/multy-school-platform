import type { Activity } from './activity.types';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  schoolId: string;
  classroomIds: string[];
  classroomId?: string;
  classroom?: { id: string; name: string };
  courseId?: string;
  course?: { id: string; name: string } | null;
  activities?: Activity[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateTeacherPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  gender?: string;
  dateOfBirth?: string;
  classroomIds?: string[];
  classroomId?: string;
  courseId?: string;
}

export interface UpdateTeacherPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  classroomIds?: string[];
  classroomId?: string;
  courseId?: string | null;
}
