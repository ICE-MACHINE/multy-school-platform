import api from './api';
import type { Notification } from '../types';

const notificationService = {
  getAll: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: Notification[] }>(`/${schoolId}/notifications`);
    return data;
  },
  markAsRead: async (schoolId: string, id: string) => {
    const { data } = await api.patch<{ success: boolean }>(`/${schoolId}/notifications/${id}/read`);
    return data;
  },
  markAllAsRead: async (schoolId: string) => {
    const { data } = await api.patch<{ success: boolean }>(`/${schoolId}/notifications/read-all`);
    return data;
  },
  sendNotification: async (schoolId: string, payload: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
  }) => {
    const { data } = await api.post<{ success: boolean; data: Notification }>(`/${schoolId}/notifications`, payload);
    return data;
  },
};
export default notificationService;
