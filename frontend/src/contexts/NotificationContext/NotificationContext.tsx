import { createContext } from 'react';
import type { NotificationContextType } from './notification.types';

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});
