import api from './api';
import type { Conversation, ConversationThread, MessageRecipient, SendGroupPayload, SendMessagePayload } from '../types';

const messageService = {
  getConversations: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: Conversation[] }>(`/${schoolId}/messages/conversations`);
    return data;
  },
  getMessages: async (schoolId: string, conversationId: string) => {
    const { data } = await api.get<{ success: boolean; data: ConversationThread }>(`/${schoolId}/messages/conversations/${conversationId}`);
    return data;
  },
  sendMessage: async (schoolId: string, payload: SendMessagePayload) => {
    const { data } = await api.post<{ success: boolean; data: any }>(`/${schoolId}/messages`, payload);
    return data;
  },
  sendGroup: async (schoolId: string, payload: SendGroupPayload) => {
    const { data } = await api.post<{ success: boolean; data: { sent: number } }>(`/${schoolId}/messages/group`, payload);
    return data;
  },
  getRecipients: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: MessageRecipient[] }>(`/${schoolId}/messages/recipients`);
    return data;
  },
  getUnreadCount: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: { unreadCount: number } }>(`/${schoolId}/messages/unread`);
    return data;
  },
  markAsRead: async (schoolId: string, conversationId: string) => {
    const { data } = await api.patch<{ success: boolean }>(`/${schoolId}/messages/conversations/${conversationId}/read`);
    return data;
  },
};
export default messageService;
