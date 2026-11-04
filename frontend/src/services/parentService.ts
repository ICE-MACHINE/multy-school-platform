import api from './api';
import type { Parent, CreateParentPayload, UpdateParentPayload, ParentDeletePreview } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const parentService = {
  create: async (schoolId: string, payload: CreateParentPayload): Promise<ApiResponse<Parent>> => {
    const { data } = await api.post<ApiResponse<Parent>>(`/${schoolId}/admin/parents`, payload);
    return data;
  },

  getAll: async (schoolId: string, params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Parent>> => {
    const { page = 1, limit = 10, search = '' } = params;
    const { data } = await api.get<PaginatedResponse<Parent>>(`/${schoolId}/admin/parents`, {
      params: { page, limit, search },
    });
    return data;
  },

  getById: async (schoolId: string, parentId: string): Promise<ApiResponse<Parent>> => {
    const { data } = await api.get<ApiResponse<Parent>>(`/${schoolId}/admin/parents/${parentId}`);
    return data;
  },

  update: async (schoolId: string, parentId: string, payload: UpdateParentPayload): Promise<ApiResponse<Parent>> => {
    const { data } = await api.put<ApiResponse<Parent>>(`/${schoolId}/admin/parents/${parentId}`, payload);
    return data;
  },

  delete: async (schoolId: string, parentId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/${schoolId}/admin/parents/${parentId}`);
    return data;
  },

  getDeletePreview: async (schoolId: string, parentId: string): Promise<ApiResponse<ParentDeletePreview>> => {
    const { data } = await api.get<ApiResponse<ParentDeletePreview>>(`/${schoolId}/admin/parents/${parentId}/delete-preview`);
    return data;
  },

  getChildren: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: any[] }>(`/${schoolId}/parent/children`);
    return data;
  },

  getChildProgress: async (schoolId: string, studentId: string) => {
    const { data } = await api.get<{ success: boolean; data: any }>(`/${schoolId}/parent/children/${studentId}/progress`);
    return data;
  },
};

export default parentService;
