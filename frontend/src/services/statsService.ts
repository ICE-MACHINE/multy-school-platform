import api, { publicApi } from './api';
import type {
  PlatformStats, PublicPlatformStats, PublicSchoolStats,
  SchoolDashboardStats, TeacherDashboardStats, ParentDashboardStats,
} from '../types';

const statsService = {
  getSuperAdminStats: async (period?: 'week' | 'month' | 'year') => {
    const { data } = await api.get<{ success: boolean; data: PlatformStats }>('/super-admin/stats', { params: { period } });
    return data;
  },
  getSchoolStats: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: SchoolDashboardStats }>(`/${schoolId}/stats`);
    return data;
  },
  getTeacherStats: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: TeacherDashboardStats }>(`/${schoolId}/stats/teacher`);
    return data;
  },
  getParentStats: async (schoolId: string, childId: string) => {
    const { data } = await api.get<{ success: boolean; data: ParentDashboardStats }>(`/${schoolId}/stats/parent/${childId}`);
    return data;
  },
  getPublicPlatformStats: async () => {
    const { data } = await publicApi.get<{ success: boolean; data: PublicPlatformStats }>('/public/platform-stats');
    return data.data;
  },
  getPublicSchoolStats: async (slug: string) => {
    const { data } = await publicApi.get<{ success: boolean; data: PublicSchoolStats }>(`/public/schools/${slug}/stats`);
    return data.data;
  },
};
export default statsService;
