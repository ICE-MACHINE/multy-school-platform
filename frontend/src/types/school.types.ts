import type { SchoolType } from './user.types';

export interface School {
  id: string;
  name: string;
  slug: string;
  type: SchoolType;
  phone: string;
  address: string;
  monthlyFee: number;
  maxUsers: number;
  maxMessages: number;
  currentUsers: number;
  currentMessages: number;
  studentCount?: number;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: string;
}

export interface CreateSchoolPayload {
  name: string;
  slug: string;
  type: SchoolType;
  phone: string;
  address: string;
  maxUsers: number;
  maxMessages: number;
  adminFirstName: string;
  adminLastName: string;
  adminPhone: string;
  adminPassword: string;
}

export interface UpdateSchoolPayload {
  name?: string;
  phone?: string;
  address?: string;
  maxUsers?: number;
  maxMessages?: number;
}

export interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClassrooms: number;
  totalCourses: number;
  totalRevenue: number;
  attendanceRate: number;
}
