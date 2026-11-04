import api from './api';
import type { QuranProgress, Surah } from '../types';

const quranProgressService = {
  getSurahs: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: Surah[] }>(`/${schoolId}/quran/surahs`);
    return data;
  },
  getByStudent: async (schoolId: string, studentId: string, includeNotReached = false) => {
    const { data } = await api.get<{ success: boolean; data: { progress?: QuranProgress[]; stats?: any } | QuranProgress[] }>(
      `/${schoolId}/quran/student/${studentId}${includeNotReached ? '?includeNotReached=true' : ''}`
    );
    return {
      ...data,
      data: Array.isArray(data.data) ? data.data : (data.data?.progress || []),
      stats: Array.isArray(data.data) ? undefined : data.data?.stats,
    };
  },
  update: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: QuranProgress }>(`/${schoolId}/quran/update`, payload);
    return data;
  },
  updateStudentSummary: async (schoolId: string, payload: { studentId: string; currentSurahNumber?: number | null; hizbs?: number }) => {
    const { data } = await api.post(`/${schoolId}/quran/student-summary`, payload);
    return data;
  },
  initialize: async (schoolId: string, studentId: string) => {
    const { data } = await api.post<{ success: boolean }>(`/${schoolId}/quran/initialize`, { studentId });
    return data;
  },
};
export default quranProgressService;
