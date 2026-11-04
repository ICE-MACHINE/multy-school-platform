import api from './api';
import type { CourseSession, CompleteCourseSessionPayload } from '../types';

const courseSessionService = {
  getSessions: async (schoolId: string, courseId: string) => {
    const { data } = await api.get<{ success: boolean; data: CourseSession[] }>(`/${schoolId}/courses/${courseId}/sessions`);
    return data;
  },
  complete: async (schoolId: string, courseId: string, payload: CompleteCourseSessionPayload) => {
    const { data } = await api.post<{ success: boolean; data: CourseSession }>(`/${schoolId}/courses/${courseId}/sessions`, payload);
    return data;
  },
  update: async (schoolId: string, courseId: string, sessionNumber: number, payload: Partial<CompleteCourseSessionPayload>) => {
    const { data } = await api.put<{ success: boolean; data: CourseSession }>(`/${schoolId}/courses/${courseId}/sessions/${sessionNumber}`, payload);
    return data;
  },
  remove: async (schoolId: string, courseId: string, sessionNumber: number) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/courses/${courseId}/sessions/${sessionNumber}`);
    return data;
  },
};
export default courseSessionService;
