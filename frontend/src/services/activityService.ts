import api from './api';
import type { Activity, ActivityPeriod, CreateActivityPayload, UpdateActivityPayload, StudentActivityParticipation, StudentActivityProgress } from '../types';

const activityService = {
  getAll: async (schoolId: string, params?: { page?: number; limit?: number; date?: string; period?: ActivityPeriod }) => {
    const { data } = await api.get<{ success: boolean; data: Activity[]; pagination: any }>(`/${schoolId}/activities`, { params });
    return data;
  },
  getById: async (schoolId: string, id: string) => {
    const { data } = await api.get<{ success: boolean; data: Activity }>(`/${schoolId}/activities/${id}`);
    return data;
  },
  create: async (schoolId: string, payload: CreateActivityPayload) => {
    const { data } = await api.post<{ success: boolean; data: Activity }>(`/${schoolId}/activities`, payload);
    return data;
  },
  update: async (schoolId: string, id: string, payload: UpdateActivityPayload) => {
    const { data } = await api.put<{ success: boolean; data: Activity }>(`/${schoolId}/activities/${id}`, payload);
    return data;
  },
  complete: async (schoolId: string, id: string, payload?: { date?: string; period?: ActivityPeriod }) => {
    const { data } = await api.post<{ success: boolean; data: { activity: Activity; alreadyCompleted: boolean } }>(`/${schoolId}/activities/${id}/complete`, payload);
    return data;
  },
  delete: async (schoolId: string, id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/activities/${id}`);
    return data;
  },
  getStudentProgress: async (schoolId: string, studentId: string) => {
    const { data } = await api.get<{ success: boolean; data: { totalActivities: number; completedActivities: number; missedActivities: number; plannedActivities: number; records: StudentActivityProgress[] } }>(`/${schoolId}/activities/student/${studentId}`);
    return data;
  },
  getParticipations: async (schoolId: string, activityId: string) => {
    const { data } = await api.get<{ success: boolean; data: StudentActivityParticipation[] }>(`/${schoolId}/activities/${activityId}/participations`);
    return data;
  },
  markParticipation: async (schoolId: string, activityId: string, payload: { studentId: string; participated: boolean; rating?: number; notes?: string }) => {
    const { data } = await api.post<{ success: boolean; data: any }>(`/${schoolId}/activities/${activityId}/participate`, payload);
    return data;
  },
  bulkMarkParticipation: async (schoolId: string, activityId: string, records: { studentId: string; participated: boolean; rating?: number; notes?: string }[]) => {
    const { data } = await api.post<{ success: boolean; data: any[] }>(`/${schoolId}/activities/${activityId}/participate/bulk`, { records });
    return data;
  },
};
export default activityService;
