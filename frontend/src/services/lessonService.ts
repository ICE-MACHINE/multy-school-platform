import api from './api';
import type { Lesson } from '../types';

const lessonService = {
  getAll: async (schoolId: string, courseId?: string) => {
    const { data } = await api.get<{ success: boolean; data: Lesson[] }>(`/${schoolId}/lessons`, { params: courseId ? { courseId } : {} });
    return data;
  },
  getById: async (schoolId: string, id: string) => {
    const { data } = await api.get<{ success: boolean; data: Lesson }>(`/${schoolId}/lessons/${id}`);
    return data;
  },
  create: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: Lesson }>(`/${schoolId}/lessons`, payload);
    return data;
  },
  update: async (schoolId: string, id: string, payload: any) => {
    const { data } = await api.put<{ success: boolean; data: Lesson }>(`/${schoolId}/lessons/${id}`, payload);
    return data;
  },
  delete: async (schoolId: string, id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/lessons/${id}`);
    return data;
  },
  complete: async (schoolId: string, lessonId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean }>(`/${schoolId}/lessons/progress`, { lessonId, ...payload });
    return data;
  },
};
export default lessonService;
