export type CoursePaymentType = 'month' | 'course' | 'session';

export interface CreatePaymentDTO {
  amount: number;
  month?: string;
  sessionDate?: string;
  courseName?: string;
  courseId?: string;
  paymentType?: CoursePaymentType;
  sessionNumber?: number;
  studentId: string;
  schoolId: string;
  recordedById: string;
  description?: string;
}
