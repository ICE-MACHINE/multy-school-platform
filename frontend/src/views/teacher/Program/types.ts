export function autoPeriod(): 'morning' | 'afternoon' {
  return new Date().getHours() < 12 ? 'morning' : 'afternoon';
}

export interface LessonLike {
  id: string;
  title: string;
  orderIndex?: number;
  programModule?: { id: string; title: string } | null;
}

export interface ProgramModuleLike {
  id: string;
  title: string;
  orderIndex: number;
  lessons: LessonLike[];
}

export interface ProgramLike {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  modules: ProgramModuleLike[];
}
