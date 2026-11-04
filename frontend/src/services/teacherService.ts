import api from './api';
import type { Student } from '../types';

const teacherService = {
  getStudents: async (schoolId: string): Promise<{ success: boolean; data: Student[] }> => {
    const { data } = await api.get<{ success: boolean; data: Student[] }>(`/${schoolId}/teacher/students`);
    return data;
  },
  getStudent: async (schoolId: string, studentId: string): Promise<{ success: boolean; data: Student }> => {
    const { data } = await api.get<{ success: boolean; data: Student }>(`/${schoolId}/teacher/students/${studentId}`);
    return data;
  },
};

export default teacherService;
