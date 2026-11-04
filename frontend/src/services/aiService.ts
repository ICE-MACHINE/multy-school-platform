import type { AxiosProgressEvent } from 'axios';
import api from './api';
import type { AiEvaluatedScheduleChangeRequest, AiPrediction, AiRiskLevel, AiScheduleChangeRequest, CurriculumIntelligence, DocumentRevision, DocumentScan, FinancialIntelligence, NotificationAdminOverview, NotificationDigestResult, ScheduleAlternativesResult } from '../types';

interface ApiResponse<T> { success: boolean; data: T }

const base = (schoolId: string) => `/${schoolId}/ai`;

const aiService = {
  getPredictions: async (schoolId: string, riskLevel?: AiRiskLevel): Promise<ApiResponse<AiPrediction[]>> => {
    const { data } = await api.get(`${base(schoolId)}/predictions`, { params: riskLevel ? { riskLevel } : undefined });
    return data;
  },

  runBatch: async (schoolId: string, locale: string): Promise<ApiResponse<AiPrediction[]>> => {
    const { data } = await api.post(`${base(schoolId)}/predictions/run`, { locale }, { timeout: 120000 });
    return data;
  },

  runStudentPrediction: async (schoolId: string, studentId: string, locale?: string): Promise<ApiResponse<AiPrediction>> => {
    const { data } = await api.post(`${base(schoolId)}/predictions/student/${studentId}`, locale ? { locale } : {}, { timeout: 60000 });
    return data;
  },

  getStudentPrediction: async (schoolId: string, studentId: string): Promise<ApiResponse<AiPrediction | null>> => {
    const { data } = await api.get(`${base(schoolId)}/predictions/student/${studentId}`);
    return data;
  },

  generateParentSummary: async (schoolId: string, studentId: string, locale?: string): Promise<ApiResponse<AiPrediction>> => {
    const { data } = await api.post(`${base(schoolId)}/parent-summary/${studentId}`, locale ? { locale } : {}, { timeout: 60000 });
    return data;
  },

  evaluatePendingScheduleRequests: async (schoolId: string): Promise<ApiResponse<{ evaluated: number; failed: number; requestIds: string[] }>> => {
    const { data } = await api.post(`${base(schoolId)}/schedule-requests/evaluate-pending`, {});
    return data;
  },

  evaluateScheduleRequest: async (schoolId: string, requestId: string): Promise<ApiResponse<AiEvaluatedScheduleChangeRequest>> => {
    const { data } = await api.post(`${base(schoolId)}/schedule-requests/${requestId}/evaluate`, {});
    return data;
  },

  suggestScheduleAlternatives: async (schoolId: string, requestId: string): Promise<ApiResponse<ScheduleAlternativesResult>> => {
    const { data } = await api.get(`${base(schoolId)}/schedule-requests/${requestId}/alternatives`);
    return data;
  },

  listPendingReview: async (schoolId: string): Promise<ApiResponse<AiScheduleChangeRequest[]>> => {
    const { data } = await api.get(`${base(schoolId)}/schedule-requests/pending-review`);
    return data;
  },

  getFinancialIntelligence: async (schoolId: string): Promise<ApiResponse<FinancialIntelligence>> => {
    const { data } = await api.get(`${base(schoolId)}/finance`);
    return data;
  },

  getCurriculumIntelligence: async (schoolId: string, yearEnd?: string): Promise<ApiResponse<CurriculumIntelligence>> => {
    const { data } = await api.get(`${base(schoolId)}/curriculum`, { params: yearEnd ? { yearEnd } : undefined });
    return data;
  },

  getNotificationIntelligence: async (schoolId: string): Promise<ApiResponse<NotificationAdminOverview>> => {
    const { data } = await api.get(`${base(schoolId)}/notifications/intelligence`);
    return data;
  },

  getNotificationDigest: async (schoolId: string, periodDays = 7): Promise<ApiResponse<NotificationDigestResult>> => {
    const { data } = await api.get(`${base(schoolId)}/notifications/digest`, { params: { periodDays } });
    return data;
  },

  listDocuments: async (schoolId: string): Promise<ApiResponse<DocumentScan[]>> => {
    const { data } = await api.get(`${base(schoolId)}/documents`);
    return data;
  },

  scanDocument: async (
    schoolId: string,
    formData: FormData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ): Promise<ApiResponse<DocumentScan>> => {
    const { data } = await api.post(`${base(schoolId)}/documents/scan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data;
  },

  confirmDocument: async (
    schoolId: string,
    id: string,
    payload: { extractedFields?: Record<string, unknown>; documentType?: string },
  ): Promise<ApiResponse<DocumentScan>> => {
    const { data } = await api.post(`${base(schoolId)}/documents/${id}/confirm`, payload);
    return data;
  },

  reviewDocument: async (
    schoolId: string,
    id: string,
    payload: { decision: 'approved' | 'rejected'; note?: string; startDate?: string; endDate?: string },
  ): Promise<ApiResponse<DocumentScan>> => {
    const { data } = await api.post(`${base(schoolId)}/documents/${id}/review`, payload);
    return data;
  },

  archiveDocument: async (schoolId: string, id: string): Promise<ApiResponse<DocumentScan>> => {
    const { data } = await api.post(`${base(schoolId)}/documents/${id}/archive`, {});
    return data;
  },

  expireStaleDocuments: async (schoolId: string): Promise<ApiResponse<{ expired: number; documentIds: string[] }>> => {
    const { data } = await api.post(`${base(schoolId)}/documents/expire-stale`, {});
    return data;
  },

  getDocumentHistory: async (schoolId: string, id: string): Promise<ApiResponse<DocumentRevision[]>> => {
    const { data } = await api.get(`${base(schoolId)}/documents/${id}/history`);
    return data;
  },

  getDocument: async (schoolId: string, id: string): Promise<ApiResponse<DocumentScan>> => {
    const { data } = await api.get(`${base(schoolId)}/documents/${id}`);
    return data;
  },

  getDocumentPreview: async (schoolId: string, id: string): Promise<{ url: string; mimeType: string }> => {
    const response = await api.get(`${base(schoolId)}/documents/${id}/preview`, { responseType: 'blob' });
    const blob = response.data as Blob;
    return { url: URL.createObjectURL(blob), mimeType: blob.type };
  },

  downloadDocument: async (schoolId: string, id: string, fileName = 'document'): Promise<void> => {
    const response = await api.get(`${base(schoolId)}/documents/${id}/file`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export default aiService;
