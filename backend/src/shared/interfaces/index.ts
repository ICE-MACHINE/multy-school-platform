export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent';
export type SchoolType = 'quranic' | 'private' | 'kindergarten';
export type Gender = 'male' | 'female';
export type QuranStatus = 'not_reached' | 'memorizing' | 'memorized';
export type CompletionType = 'full' | 'partial';
export type MemorizationType = 'speed' | 'accuracy';
export type Grade = 'good' | 'very_good' | 'excellent';
export type LessonStatus = 'not_started' | 'completed' | 'absent' | 'not_enrolled';
export type SenderType = 'teacher' | 'parent' | 'school_admin';
export type NotificationType = 'absence' | 'payment' | 'general' | 'message' | 'activity' | 'schedule_change';

export interface AuthUser {
  id: string;
  role: UserRole;
  schoolId?: string;
  slug?: string;
}

export interface JWTPayload {
  id: string;
  role: UserRole;
  schoolId?: string;
  slug?: string;
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}