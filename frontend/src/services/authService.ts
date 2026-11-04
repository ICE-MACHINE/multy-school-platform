import api from './api';
import type { AuthResponse, LoginPayload } from '../types';
import { purgeLegacyStoredTokens } from '../utils/tokenKeys';

const authService = {
  loginSuperAdmin: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/super-admin/login', payload);
    return data;
  },

  loginSchool: async (schoolId: string, payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>(`/auth/school/${schoolId}/login`, payload);
    return data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/refresh', {});
    return data;
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const { data } = await api.get<AuthResponse>('/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      purgeLegacyStoredTokens();
    }
  },

  logoutAll: async (): Promise<void> => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      purgeLegacyStoredTokens();
    }
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string; currentPassword?: string; newPassword?: string }) => {
    const { data: res } = await api.put('/auth/update-profile', data);
    return res;
  },

  resetPassword: async (userId: string, role: string, newPassword: string) => {
    const { data: res } = await api.post('/auth/reset-password', { userId, role, newPassword });
    return res;
  },
};

export default authService;
