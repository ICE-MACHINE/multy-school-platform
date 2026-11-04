import api from './api';
import type { TimetableSettings, TimetableSlot, ScheduleChangeRequest, DayOfWeek } from '../types';

interface ApiResponse<T> { success: boolean; data: T }

const timetableService = {
  getSettings: async (schoolId: string): Promise<ApiResponse<TimetableSettings>> => {
    const { data } = await api.get(`/${schoolId}/timetable/settings`);
    return data;
  },

  updateSettings: async (schoolId: string, payload: { studyDays: DayOfWeek[]; periods: { id: string; label: string; startTime: string; endTime: string }[] }): Promise<ApiResponse<TimetableSettings>> => {
    const { data } = await api.put(`/${schoolId}/timetable/settings`, payload);
    return data;
  },

  getSlots: async (schoolId: string, day?: DayOfWeek): Promise<ApiResponse<TimetableSlot[]>> => {
    const { data } = await api.get(`/${schoolId}/timetable/slots`, { params: { day } });
    return data;
  },

  getMySlots: async (schoolId: string): Promise<ApiResponse<TimetableSlot[]>> => {
    const { data } = await api.get(`/${schoolId}/timetable/slots/mine`);
    return data;
  },

  getChildSlots: async (schoolId: string, studentId: string): Promise<ApiResponse<TimetableSlot[]>> => {
    const { data } = await api.get(`/${schoolId}/timetable/slots/child/${studentId}`);
    return data;
  },

  createSlot: async (schoolId: string, payload: {
    teacherId: string; day: DayOfWeek; startTime: string; duration: number; color?: string;
  }): Promise<ApiResponse<TimetableSlot>> => {
    const { data } = await api.post(`/${schoolId}/timetable/slots`, payload);
    return data;
  },

  updateSlot: async (schoolId: string, slotId: string, payload: Partial<{
    teacherId: string; day: DayOfWeek; startTime: string; duration: number; color: string;
  }>): Promise<ApiResponse<TimetableSlot>> => {
    const { data } = await api.put(`/${schoolId}/timetable/slots/${slotId}`, payload);
    return data;
  },

  deleteSlot: async (schoolId: string, slotId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/${schoolId}/timetable/slots/${slotId}`);
    return data;
  },

  moveSlot: async (schoolId: string, slotId: string, payload: { day: DayOfWeek; periodId: string; startTime?: string }): Promise<ApiResponse<TimetableSlot>> => {
    const { data } = await api.patch(`/${schoolId}/timetable/slots/${slotId}/move`, payload);
    return data;
  },

  getChangeRequests: async (schoolId: string): Promise<ApiResponse<ScheduleChangeRequest[]>> => {
    const { data } = await api.get(`/${schoolId}/timetable/requests`);
    return data;
  },

  createChangeRequest: async (schoolId: string, payload: {
    slotId: string; requestedDay?: DayOfWeek; requestedPeriodId?: string; reason?: string;
  }): Promise<ApiResponse<ScheduleChangeRequest>> => {
    const { data } = await api.post(`/${schoolId}/timetable/requests`, payload);
    return data;
  },

  handleRequest: async (schoolId: string, requestId: string, payload: {
    status: 'approved' | 'rejected'; adminNote?: string;
  }): Promise<ApiResponse<ScheduleChangeRequest>> => {
    const { data } = await api.patch(`/${schoolId}/timetable/requests/${requestId}`, payload);
    return data;
  },

  cleanupOldRequests: async (schoolId: string): Promise<ApiResponse<{ deleted: number }>> => {
    const { data } = await api.delete(`/${schoolId}/timetable/requests/cleanup`);
    return data;
  },
};

export default timetableService;
