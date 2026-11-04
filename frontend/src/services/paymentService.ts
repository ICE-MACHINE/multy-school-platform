import api from './api';
import type { Payment, CoursePaymentStatus } from '../types';

const paymentService = {
  getAll: async (schoolId: string, params?: any) => {
    const { data } = await api.get<{ success: boolean; data: Payment[]; pagination: any }>(`/${schoolId}/payments`, { params });
    return data;
  },
  getByStudent: async (schoolId: string, studentId: string) => {
    const { data } = await api.get<{ success: boolean; data: Payment[] }>(`/${schoolId}/payments/student/${studentId}`);
    return data;
  },
  getStudentCoursePayments: async (schoolId: string, studentId: string) => {
    const { data } = await api.get<{ success: boolean; data: CoursePaymentStatus[] }>(`/${schoolId}/payments/student/${studentId}/courses`);
    return data;
  },
  create: async (schoolId: string, payload: any) => {
    const { data } = await api.post<{ success: boolean; data: Payment }>(`/${schoolId}/payments`, payload);
    return data;
  },
  getReceipt: async (schoolId: string, id: string) => {
    const { data } = await api.get<{ success: boolean; data: Payment & { schoolName: string } }>(`/${schoolId}/payments/${id}/receipt`);
    return data;
  },
  checkRemaining: async (schoolId: string, studentId: string) => {
    const { data } = await api.get<{ success: boolean; data: { remainingMonths: number; monthlyFee: number; paidMonths: number; exempt: boolean } }>(`/${schoolId}/payments/student/${studentId}/remaining`);
    return data;
  },
  getPrintMonths: async (schoolId: string) => {
    const { data } = await api.get<{ success: boolean; data: { month: string; count: number }[] }>(`/${schoolId}/payments/print-months`);
    return data;
  },
  getForPrint: async (schoolId: string, months: string[]) => {
    const { data } = await api.get<{ success: boolean; data: { schoolName: string; data: Payment[] } }>(`/${schoolId}/payments/print`, { params: { months: months.join(',') } });
    return data;
  },
};
export default paymentService;
