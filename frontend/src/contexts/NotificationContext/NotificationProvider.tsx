import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { NotificationContext } from './NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import notificationService from '../../services/notificationService';
import type { Notification } from '../../types';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      const res = await notificationService.getAll(user.schoolId);
      setNotifications(res.data || []);
    } catch { /* ignore */ }
  }, [user?.schoolId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    if (!user?.schoolId) return;
    try {
      await notificationService.markAsRead(user.schoolId, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      /* تجاهل الأخطاء حتى لا تتعطل التنقلات عند انتهاء الجلسة */
    }
  };

  const markAllAsRead = async () => {
    if (!user?.schoolId) return;
    try {
      await notificationService.markAllAsRead(user.schoolId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* تجاهل الأخطاء */
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
