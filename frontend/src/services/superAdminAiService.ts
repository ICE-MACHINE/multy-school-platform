import api from './api';
import i18n from '../i18n';
import type { AiBriefing, AiChatMessage, AiChatResponse, AiInsight, PlatformTrends } from '../types';

interface ApiResponse<T> { success: boolean; data: T }

const base = '/super-admin/ai';

const superAdminAiService = {
  getBriefing: async (): Promise<ApiResponse<AiBriefing>> => {
    const { data } = await api.get<ApiResponse<AiBriefing>>(`${base}/briefing`);
    return data;
  },

  getInsights: async (): Promise<ApiResponse<AiInsight[]>> => {
    const { data } = await api.get<ApiResponse<AiInsight[] | { insights: AiInsight[] }>>(`${base}/insights`);
    const insights = Array.isArray(data.data) ? data.data : data.data?.insights ?? [];
    return { success: data.success, data: insights };
  },

  getTrends: async (): Promise<ApiResponse<PlatformTrends>> => {
    const { data } = await api.get<ApiResponse<PlatformTrends>>(`${base}/trends`);
    return data;
  },

  chat: async (message: string, history: AiChatMessage[]): Promise<ApiResponse<AiChatResponse>> => {
    const { data } = await api.post<ApiResponse<AiChatResponse>>(`${base}/chat`, {
      message,
      history,
      locale: i18n.resolvedLanguage || i18n.language || 'en',
    });
    return data;
  },
};

export default superAdminAiService;
