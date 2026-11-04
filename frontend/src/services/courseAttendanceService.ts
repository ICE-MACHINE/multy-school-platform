import api from './api';
import type { CourseAttendance, CourseAttendanceFilters, CourseAttendanceSummary, CourseSessionAttendanceView, CourseStudentAttendance, BulkCourseAttendancePayload } from '../types';

export interface StudentCourseDetail {
  course: { id: string; name: string; teacherId: string | null };
  student: { id: string; firstName: string; lastName: string; registrationNumber: string };
  sessions: {
    sessionNumber: number;
    date: string;
    period: string;
    lessons: { id: string; title: string; description?: string; order: number }[];
    attendance: { isAbsent: boolean; justified: boolean; justification: string | null } | null;
  }[];
  summary: {
    totalSessions: number;
    presentDays: number;
    absentDays: number;
    justifiedAbsences: number;
    unjustifiedAbsences: number;
    attendanceRate: number;
  };
}

const courseAttendanceService = {
  getByCourse: async (schoolId: string, courseId: string, filters: CourseAttendanceFilters = {}, page = 1, limit = 20) => {
    const { data } = await api.get<{ success: boolean; data: CourseAttendance[]; pagination: { total: number } }>(
      `/${schoolId}/courses/${courseId}/attendance`,
      { params: { ...filters, page, limit } },
    );
    return data;
  },
  getSummary: async (schoolId: string, courseId: string, filters: CourseAttendanceFilters = {}) => {
    const { data } = await api.get<{ success: boolean; data: CourseAttendanceSummary }>(
      `/${schoolId}/courses/${courseId}/attendance/summary`,
      { params: filters },
    );
    return data;
  },
  getBySession: async (schoolId: string, courseId: string, sessionNumber: number) => {
    const { data } = await api.get<{ success: boolean; data: CourseSessionAttendanceView }>(
      `/${schoolId}/courses/${courseId}/attendance/sessions/${sessionNumber}`,
    );
    return data;
  },
  bulkUpsert: async (schoolId: string, courseId: string, payload: BulkCourseAttendancePayload) => {
    const { data } = await api.post<{ success: boolean; data: CourseAttendance[] }>(
      `/${schoolId}/courses/${courseId}/attendance/bulk`,
      payload,
    );
    return data;
  },
  upsert: async (schoolId: string, courseId: string, payload: { sessionNumber: number; studentId: string; isAbsent: boolean; justification?: string }) => {
    const { data } = await api.post<{ success: boolean; data: CourseAttendance }>(
      `/${schoolId}/courses/${courseId}/attendance`,
      payload,
    );
    return data;
  },
  update: async (schoolId: string, courseId: string, attendanceId: string, payload: { isAbsent?: boolean; justification?: string }) => {
    const { data } = await api.put<{ success: boolean; data: CourseAttendance }>(
      `/${schoolId}/courses/${courseId}/attendance/${attendanceId}`,
      payload,
    );
    return data;
  },
  justify: async (schoolId: string, courseId: string, attendanceId: string, justification: string) => {
    const { data } = await api.patch<{ success: boolean; data: CourseAttendance }>(
      `/${schoolId}/courses/${courseId}/attendance/${attendanceId}/justify`,
      { justification },
    );
    return data;
  },
  remove: async (schoolId: string, courseId: string, attendanceId: string) => {
    const { data } = await api.delete<{ success: boolean }>(
      `/${schoolId}/courses/${courseId}/attendance/${attendanceId}`,
    );
    return data;
  },
  getByStudent: async (schoolId: string, studentId: string, month?: string) => {
    const { data } = await api.get<{ success: boolean; data: CourseStudentAttendance }>(
      `/${schoolId}/course-attendance/student/${studentId}`,
      { params: { month } },
    );
    return data;
  },
  getStudentCourseDetail: async (schoolId: string, studentId: string, courseId: string) => {
    const { data } = await api.get<{ success: boolean; data: StudentCourseDetail }>(
      `/${schoolId}/course-attendance/student/${studentId}/course/${courseId}`,
    );
    return data;
  },
};

export default courseAttendanceService;
