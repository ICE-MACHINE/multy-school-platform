import api from './api';
import type { Attendance, ActivityPeriod, CreateAttendancePayload, UpdateAttendancePayload, BulkAttendancePayload } from '../types';

export interface AttendanceFilters {
  date?: string;
  from?: string;
  to?: string;
  period?: ActivityPeriod;
  studentId?: string;
  isAbsent?: string;
  justified?: string;
  search?: string;
}

export interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  attendanceRate: number;
}

const attendanceService = {
  getAll: async (schoolId: string, filters: AttendanceFilters = {}, page = 1, limit = 20) => {
    const { data } = await api.get<{ success: boolean; data: Attendance[]; pagination: { total: number } }>(`/${schoolId}/attendance`, { params: { ...filters, page, limit } });
    return data;
  },
  getByDate: async (schoolId: string, date: string, period?: ActivityPeriod) => {
    const { data } = await api.get<{ success: boolean; data: Attendance[] }>(`/${schoolId}/attendance`, { params: { date, period } });
    return data;
  },
  getSummary: async (schoolId: string, filters: AttendanceFilters = {}) => {
    const { data } = await api.get<{ success: boolean; data: AttendanceSummary }>(`/${schoolId}/attendance/summary`, { params: filters });
    return data;
  },
  getByStudent: async (schoolId: string, studentId: string, month?: string) => {
    const { data } = await api.get<{ success: boolean; data: { records: Attendance[]; summary: { totalDays: number; presentDays: number; absentDays: number; justifiedAbsences: number; unjustifiedAbsences: number } } }>(`/${schoolId}/attendance/student/${studentId}`, { params: { month } });
    return data;
  },
  getAbsenceCounts: async (schoolId: string, month?: string) => {
    const { data } = await api.get<{ success: boolean; data: { studentId: string; totalAbsences: number; unjustifiedAbsences: number }[] }>(`/${schoolId}/attendance/absences/counts`, { params: { month } });
    return data;
  },
  create: async (schoolId: string, payload: CreateAttendancePayload) => {
    const { data } = await api.post<{ success: boolean; data: Attendance }>(`/${schoolId}/attendance`, payload);
    return data;
  },
  bulkCreate: async (schoolId: string, payload: BulkAttendancePayload) => {
    const { data } = await api.post<{ success: boolean; data: Attendance[] }>(`/${schoolId}/attendance/bulk`, payload);
    return data;
  },
  update: async (schoolId: string, id: string, payload: UpdateAttendancePayload) => {
    const { data } = await api.put<{ success: boolean; data: Attendance }>(`/${schoolId}/attendance/${id}`, payload);
    return data;
  },
  justify: async (schoolId: string, id: string, justification: string) => {
    const { data } = await api.patch<{ success: boolean; data: Attendance }>(`/${schoolId}/attendance/${id}/justify`, { justification });
    return data;
  },
  delete: async (schoolId: string, id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/attendance/${id}`);
    return data;
  },
};
export default attendanceService;
