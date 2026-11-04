import api from './api';
import type { Teacher, CreateTeacherPayload, UpdateTeacherPayload } from '../types';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const teacherManagementService = {
  getAll: async (schoolId: string, params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Teacher>> => {
    const { page = 1, limit = 10, search = '' } = params;
    const { data } = await api.get<PaginatedResponse<Teacher>>(`/${schoolId}/admin/teachers`, {
      params: { page, limit, search },
    });
    return data;
  },
  getById: async (schoolId: string, teacherId: string): Promise<{ success: boolean; data: Teacher }> => {
    const { data } = await api.get<{ success: boolean; data: Teacher }>(`/${schoolId}/admin/teachers/${teacherId}`);
    return data;
  },
  create: async (schoolId: string, payload: CreateTeacherPayload): Promise<{ success: boolean; data: Teacher }> => {
    const { data } = await api.post<{ success: boolean; data: Teacher }>(`/${schoolId}/admin/teachers`, payload);
    return data;
  },
  update: async (schoolId: string, teacherId: string, payload: UpdateTeacherPayload): Promise<{ success: boolean; data: Teacher }> => {
    const { data } = await api.put<{ success: boolean; data: Teacher }>(`/${schoolId}/admin/teachers/${teacherId}`, payload);
    return data;
  },
  delete: async (schoolId: string, teacherId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/admin/teachers/${teacherId}`);
    return data;
  },
};

export default teacherManagementService;
