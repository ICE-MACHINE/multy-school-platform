export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  schoolId: string;
  classroomId?: string;
  parentId?: string;
  isExempt?: boolean;
  isExemptFromPayment?: boolean;
  isActive: boolean;
  quranCurrentSurahNumber?: number | null;
  quranHizbs?: number;
  registrationNumber: string;
  paymentStatus?: 'exempt' | 'overdue' | 'due' | 'upcoming' | 'paid';
  healthStatus?: string;
  classroom?: { id: string; name: string };
  parent?: { id: string; firstName: string; lastName: string };
  enrolledCourses?: { id: string; name: string; pricePerMonth?: number; pricePerSession?: number; pricePerCourse?: number; hasMonthOption: boolean; hasSessionOption: boolean; hasCourseOption: boolean; startDate?: string; numberOfSessions?: number }[];
  createdAt: string;
}

export interface CreateStudentPayload {
  registrationNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  classroomId?: string;
  parentId?: string;
  healthStatus?: string;
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  classroomId?: string;
  parentId?: string;
  healthStatus?: string;
}

export interface AssignClassroomPayload {
  classroomId: string;
}
