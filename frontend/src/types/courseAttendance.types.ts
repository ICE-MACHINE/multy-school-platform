import type { ActivityPeriod } from './activity.types';
import type { CourseSessionLesson } from './courseSession.types';

export interface CourseAttendanceStudent {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
}

export interface CourseAttendance {
  id: string;
  courseId: string;
  sessionId: string | null;
  studentId: string;
  date: string;
  period: ActivityPeriod;
  isAbsent: boolean;
  justified: boolean;
  justification?: string;
  recordedById?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  student?: CourseAttendanceStudent;
  course?: { id: string; name: string };
}

export interface CourseSessionAttendanceView {
  sessionNumber: number;
  date: string | null;
  period: ActivityPeriod;
  lessons: CourseSessionLesson[];
  attendance: CourseAttendance[];
}

export interface CourseAttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  attendanceRate: number;
}

export interface CourseAttendanceFilters {
  date?: string;
  from?: string;
  to?: string;
  period?: ActivityPeriod;
  month?: string;
  studentId?: string;
  isAbsent?: string;
  justified?: string;
  search?: string;
}

export interface CourseStudentAttendanceGroup {
  courseId: string;
  courseName: string;
  records: CourseAttendance[];
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    justifiedAbsences: number;
    unjustifiedAbsences: number;
  };
}

export interface CourseStudentAttendance {
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  courses: CourseStudentAttendanceGroup[];
  summary: {
    totalRecords: number;
    absentDays: number;
    justifiedAbsences: number;
    unjustifiedAbsences: number;
  };
}

export interface BulkCourseAttendancePayload {
  sessionNumber: number;
  records: { studentId: string; isAbsent: boolean }[];
}
