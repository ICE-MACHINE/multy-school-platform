export interface CreateProgramDTO {
  title: string;
  description?: string;
  courseId: string;
}

export interface CreateProgramModuleDTO {
  title: string;
  orderIndex?: number;
  programId: string;
}