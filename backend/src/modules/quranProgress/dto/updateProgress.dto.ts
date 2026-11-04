export interface UpdateProgressDTO {
  studentId: string;
  surahId: number;
  status: 'not_reached' | 'memorizing' | 'memorized';
  completionType?: 'full' | 'partial';
  lastAyah?: number;
  memorizationType?: 'speed' | 'accuracy';
  grade?: 'good' | 'very_good' | 'excellent';
  schoolId: string;
}