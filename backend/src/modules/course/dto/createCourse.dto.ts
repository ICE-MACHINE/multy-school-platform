export interface CreateCourseDTO {
  name: string;
  description?: string;
  capacity?: number;
  pricePerSession?: number;
  pricePerCourse?: number;
  pricePerMonth?: number;
  hasSessionOption?: boolean;
  hasCourseOption?: boolean;
  hasMonthOption?: boolean;
  schoolId: string;
  teacherId?: string;
}