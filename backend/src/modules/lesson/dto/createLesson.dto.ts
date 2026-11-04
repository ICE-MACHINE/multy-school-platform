export interface CreateLessonDTO {
  title: string;
  orderIndex?: number;
  programModuleId?: string;
  courseId: string;
  schoolId: string;
}