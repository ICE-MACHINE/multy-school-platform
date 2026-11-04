import api, { publicApi } from './api';
import type { School, CreateSchoolPayload, UpdateSchoolPayload, SchoolStats } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const schoolService = {
  create: async (payload: CreateSchoolPayload): Promise<ApiResponse<School>> => {
    const { data } = await api.post<ApiResponse<School>>('/schools', payload);
    return data;
  },

  getAll: async (page = 1, limit = 10, search = ''): Promise<PaginatedResponse<School>> => {
    const { data } = await api.get<PaginatedResponse<School>>('/schools', {
      params: { page, limit, search },
    });
    return data;
  },

  getById: async (schoolId: string): Promise<ApiResponse<School>> => {
    const { data } = await api.get<ApiResponse<School>>(`/schools/${schoolId}`);
    return data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<School>> => {
    const { data } = await api.get<ApiResponse<School>>(`/schools/slug/${slug}`);
    return data;
  },

  getPublicSchool: async (slug: string): Promise<ApiResponse<School>> => {
    const { data } = await publicApi.get<ApiResponse<School>>(`/public/schools/${slug}`);
    return data;
  },

  update: async (schoolId: string, payload: UpdateSchoolPayload): Promise<ApiResponse<School>> => {
    const { data } = await api.put<ApiResponse<School>>(`/schools/${schoolId}`, payload);
    return data;
  },

  freeze: async (schoolId: string): Promise<ApiResponse<School>> => {
    const { data } = await api.patch<ApiResponse<School>>(`/schools/${schoolId}/freeze`);
    return data;
  },

  unfreeze: async (schoolId: string): Promise<ApiResponse<School>> => {
    const { data } = await api.patch<ApiResponse<School>>(`/schools/${schoolId}/unfreeze`);
    return data;
  },

  delete: async (schoolId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/schools/${schoolId}`);
    return data;
  },

  clearMessages: async (schoolId: string, count: number): Promise<ApiResponse<{ deleted: number; remaining: number }>> => {
    const { data } = await api.delete<ApiResponse<{ deleted: number; remaining: number }>>(`/schools/${schoolId}/messages?count=${count}`);
    return data;
  },

  getStats: async (schoolId: string): Promise<ApiResponse<SchoolStats>> => {
    const { data } = await api.get<ApiResponse<SchoolStats>>(`/schools/${schoolId}/stats`);
    return data;
  },

  getAdmin: async (schoolId: string): Promise<ApiResponse<{ id: string; firstName: string; lastName: string; phone: string }>> => {
    const { data } = await api.get(`/super-admin/schools/${schoolId}/admin`);
    return data;
  },

  updateSettings: async (schoolId: string, payload: { monthlyFee: number }): Promise<ApiResponse<School>> => {
    const { data } = await api.put<ApiResponse<School>>(`/${schoolId}/admin/settings`, payload);
    return data;
  },
};

export default schoolService;
