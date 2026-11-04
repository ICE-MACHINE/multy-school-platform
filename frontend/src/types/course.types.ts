export interface Course {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerSession?: number;
  pricePerCourse?: number;
  pricePerMonth?: number;
  hasSessionOption: boolean;
  hasCourseOption: boolean;
  hasMonthOption: boolean;
  startDate?: string;
  numberOfSessions?: number;
  schoolId: string;
  teacherId?: string;
  teacher?: { id: string; firstName: string; lastName: string };
  enrolledStudents?: { id: string; firstName: string; lastName: string; registrationNumber: string }[];
  createdAt: string;
}

export interface CreateCoursePayload {
  name: string;
  description?: string;
  capacity?: number;
  pricePerSession?: number;
  pricePerCourse?: number;
  pricePerMonth?: number;
  hasSessionOption?: boolean;
  hasCourseOption?: boolean;
  hasMonthOption?: boolean;
  startDate?: string;
  numberOfSessions?: number;
  teacherId?: string;
}

export interface UpdateCoursePayload {
  name?: string;
  description?: string;
  capacity?: number;
  pricePerSession?: number;
  pricePerCourse?: number;
  pricePerMonth?: number;
  hasSessionOption?: boolean;
  hasCourseOption?: boolean;
  hasMonthOption?: boolean;
  startDate?: string;
  numberOfSessions?: number;
  teacherId?: string;
}
