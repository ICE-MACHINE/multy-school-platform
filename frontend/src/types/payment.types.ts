export type CoursePaymentType = 'month' | 'course' | 'session';

export interface Payment {
  id: string;
  amount: number;
  month?: string;
  sessionDate?: string;
  courseName?: string;
  courseId?: string;
  paymentType?: CoursePaymentType;
  sessionNumber?: number;
  studentId: string;
  studentFullName?: string;
  schoolId: string;
  recordedById?: string;
  paymentDate: string;
  description?: string;
  receiptNumber: string;
  refunded?: boolean;
  refundedAt?: string;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string; registrationNumber: string };
  recordedBy?: { id: string; fullName: string };
}

export interface CreatePaymentPayload {
  studentId: string;
  amount: number;
  month?: string;
  courseId?: string;
  paymentType?: CoursePaymentType;
  sessionNumber?: number;
  description?: string;
  paymentDate?: string;
}

export interface CoursePaymentStatus {
  course: {
    id: string;
    name: string;
    startDate?: string;
    numberOfSessions?: number;
  };
  paymentType: CoursePaymentType | null;
  price: number;
  totalRequired: number;
  paidCount: number;
  isPaid: boolean;
  paidMonths: string[];
  paidSessions: number[];
  isCoursePaid: boolean;
  completedSessions?: number[];
  nextPayableSession?: number | null;
}

export type UnenrollRefundMode = 'required' | 'adminDecision' | 'none';

export interface UnenrollRefundItem {
  paymentId?: string;
  label: string;
  amount: number;
}

export interface UnenrollPreview {
  coursePaymentType: CoursePaymentType | null;
  mode: UnenrollRefundMode;
  refundAmount: number;
  items: UnenrollRefundItem[];
  completedSessionNumbers: number[];
}

export interface RefundItem {
  month: string;
  amount: number;
}

export interface CourseRefundItem {
  courseId?: string;
  courseName?: string;
  paymentId?: string;
  label: string;
  amount: number;
}

export interface StudentDeletePreview {
  courseRefundItems: CourseRefundItem[];
  courseRefundTotal: number;
  legacyRefundItems: RefundItem[];
  legacyRefundTotal: number;
  totalRefund: number;
}

export interface ChildRefundGroup {
  studentId: string;
  studentName: string;
  items: RefundItem[];
  subtotal: number;
}

export interface ParentDeletePreview {
  courseRefundItems: CourseRefundItem[];
  courseRefundTotal: number;
  legacyChildren: ChildRefundGroup[];
  legacyRefundTotal: number;
  totalRefund: number;
}
