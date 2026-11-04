import api from './api';
import type { Program, ProgramWithModules } from '../types';

const programService = {
  getByCourse: async (schoolId: string, courseId: string) => {
    const { data } = await api.get<{ success: boolean; data: ProgramWithModules }>(`/${schoolId}/programs/course/${courseId}`);
    return data;
  },
  create: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: Program }>(`/${schoolId}/programs`, payload);
    return data;
  },
  update: async (schoolId: string, id: string, payload: any) => {
    const { data } = await api.put<{ success: boolean; data: Program }>(`/${schoolId}/programs/${id}`, payload);
    return data;
  },
  delete: async (schoolId: string, id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/programs/${id}`);
    return data;
  },
  createModule: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: any }>(`/${schoolId}/programs/modules`, payload);
    return data;
  },
  updateModule: async (schoolId: string, moduleId: string, payload: any) => {
    const { data } = await api.put<{ success: boolean; data: any }>(`/${schoolId}/programs/modules/${moduleId}`, payload);
    return data;
  },
  deleteModule: async (schoolId: string, moduleId: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/${schoolId}/programs/modules/${moduleId}`);
    return data;
  },
};
export default programService;
