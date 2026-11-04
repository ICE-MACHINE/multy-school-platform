import api from './api';
import type { Student, CreateStudentPayload, UpdateStudentPayload, StudentDeletePreview } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const studentService = {
  create: async (schoolId: string, payload: CreateStudentPayload): Promise<ApiResponse<Student>> => {
    const { data } = await api.post<ApiResponse<Student>>(`/${schoolId}/admin/students`, payload);
    return data;
  },

  getAll: async (schoolId: string, params: { page?: number; limit?: number; search?: string; gender?: string; classroomId?: string; courseId?: string; paymentStatus?: string } = {}): Promise<PaginatedResponse<Student>> => {
    const { page = 1, limit = 10, search = '', gender = '', classroomId = '', courseId = '', paymentStatus = '' } = params;
    const { data } = await api.get<PaginatedResponse<Student>>(`/${schoolId}/admin/students`, {
      params: { page, limit, search, gender, classroomId, courseId, paymentStatus },
    });
    return data;
  },

  getById: async (schoolId: string, studentId: string): Promise<ApiResponse<Student>> => {
    const { data } = await api.get<ApiResponse<Student>>(`/${schoolId}/admin/students/${studentId}`);
    return data;
  },

  update: async (schoolId: string, studentId: string, payload: UpdateStudentPayload): Promise<ApiResponse<Student>> => {
    const { data } = await api.put<ApiResponse<Student>>(`/${schoolId}/admin/students/${studentId}`, payload);
    return data;
  },

  delete: async (schoolId: string, studentId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/${schoolId}/admin/students/${studentId}`);
    return data;
  },

  getDeletePreview: async (schoolId: string, studentId: string): Promise<ApiResponse<StudentDeletePreview>> => {
    const { data } = await api.get<ApiResponse<StudentDeletePreview>>(`/${schoolId}/admin/students/${studentId}/delete-preview`);
    return data;
  },

  assignClassroom: async (schoolId: string, studentId: string, classroomId: string): Promise<ApiResponse<Student>> => {
    const { data } = await api.post<ApiResponse<Student>>(`/${schoolId}/admin/students/${studentId}/assign-classroom`, { classroomId });
    return data;
  },

  toggleExemption: async (schoolId: string, studentId: string): Promise<ApiResponse<Student>> => {
    const { data } = await api.patch<ApiResponse<Student>>(`/${schoolId}/students/${studentId}/exemption`);
    return data;
  },

  getCourseProgress: async (schoolId: string, studentId: string): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get<ApiResponse<any[]>>(`/${schoolId}/students/${studentId}/course-progress`);
    return data;
  },
};

export default studentService;
