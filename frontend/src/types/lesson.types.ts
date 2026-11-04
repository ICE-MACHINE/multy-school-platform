export type LessonStatus = 'not_started' | 'completed' | 'absent';

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  orderIndex?: number;
  programModuleId?: string;
  programModule?: { id: string; title: string } | null;
  content?: string;
  duration?: number;
  status: LessonStatus;
  createdAt: string;
}

export interface CreateLessonPayload {
  courseId: string;
  title: string;
  description?: string;
  order: number;
  content?: string;
  duration?: number;
}

export interface UpdateLessonPayload {
  title?: string;
  description?: string;
  order?: number;
  content?: string;
  duration?: number;
  status?: LessonStatus;
}

export interface LessonCompletion {
  lessonId: string;
  studentId: string;
  completedAt: string;
  grade?: number;
  notes?: string;
}
