export type NotificationType = 'absence' | 'payment' | 'general' | 'message' | 'activity' | 'schedule_change';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientId: string;
  recipientRole: string;
  schoolId: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
