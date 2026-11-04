import api from './api';
import type { Classroom } from '../types';

const classroomService = {
  getAll: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: Classroom[] }>(`/${schoolId}/classrooms`);
    return data;
  },
  getById: async (schoolId: string, id: string) => {
    const { data } = await api.get<{ success: boolean; data: Classroom }>(`/${schoolId}/classrooms/${id}`);
    return data;
  },
  create: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: Classroom }>(`/${schoolId}/classrooms`, payload);
    return data;
  },
  update: async (schoolId: string, id: string, payload: any) => {
    const { data } = await api.put<{ success: boolean; data: Classroom }>(`/${schoolId}/classrooms/${id}`, payload);
    return data;
  },
  delete: async (schoolId: string, id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/classrooms/${id}`);
    return data;
  },
  assignTeacher: async (schoolId: string, id: string, teacherId: string) => {
    const { data } = await api.put<{ success: boolean; data: Classroom }>(`/${schoolId}/classrooms/${id}/assign-teacher`, { teacherId });
    return data;
  },
};
export default classroomService;
