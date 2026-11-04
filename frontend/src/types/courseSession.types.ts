import type { ActivityPeriod } from './activity.types';

export interface CourseSessionLesson {
  id: string;
  title: string;
  courseId: string;
}

export interface CourseSession {
  id: string;
  courseId: string;
  sessionNumber: number;
  completedAt: string | null;
  period: ActivityPeriod;
  notes?: string;
  lessons: CourseSessionLesson[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteCourseSessionPayload {
  sessionNumber: number;
  completedAt?: string;
  period?: ActivityPeriod;
  lessonIds: string[];
}
