import api from './api';
import type { Course, UnenrollPreview } from '../types';

const courseService = {
  getAll: async (schoolId: string, params?: any) => {
    const { data } = await api.get<{ success: boolean; data: Course[]; pagination: any }>(`/${schoolId}/courses`, { params });
    return data;
  },
  getById: async (schoolId: string, id: string) => {
    const { data } = await api.get<{ success: boolean; data: Course }>(`/${schoolId}/courses/${id}`);
    return data;
  },
  create: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: Course }>(`/${schoolId}/courses`, payload);
    return data;
  },
  update: async (schoolId: string, id: string, payload: any) => {
    const { data } = await api.put<{ success: boolean; data: Course }>(`/${schoolId}/courses/${id}`, payload);
    return data;
  },
  delete: async (schoolId: string, id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/courses/${id}`);
    return data;
  },
  enrollStudent: async (schoolId: string, courseId: string, studentId: string) => {
    const { data } = await api.post<{ success: boolean; data: Course }>(`/${schoolId}/courses/${courseId}/enroll`, { studentId });
    return data;
  },
  unenrollStudent: async (schoolId: string, courseId: string, studentId: string, refund?: boolean) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/courses/${courseId}/unenroll/${studentId}`, {
      params: refund === undefined ? {} : { refund },
    });
    return data;
  },
  getUnenrollPreview: async (schoolId: string, courseId: string, studentId: string) => {
    const { data } = await api.get<{ success: boolean; data: UnenrollPreview }>(`/${schoolId}/courses/${courseId}/unenroll-preview/${studentId}`);
    return data;
  },
  getEnrolledStudents: async (schoolId: string, courseId: string) => {
    const { data } = await api.get<{ success: boolean; data: any[] }>(`/${schoolId}/courses/${courseId}/students`);
    return data;
  },
};
export default courseService;
