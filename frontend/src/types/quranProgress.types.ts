export interface Surah {
  id: number;
  number: number;
  nameArabic: string;
  nameEnglish: string;
  totalAyahs: number;
  juz: number;
}

export type QuranStatus = 'not_reached' | 'memorizing' | 'memorized';
export type CompletionType = 'full' | 'partial';
export type MemorizationType = 'speed' | 'accuracy';
export type Grade = 'good' | 'very_good' | 'excellent';

export interface QuranProgress {
  id: string;
  studentId: string;
  surahId: number;
  surah?: Surah;
  status: QuranStatus;
  completionType?: CompletionType | null;
  lastAyah?: number | null;
  memorizationType?: MemorizationType | null;
  grade?: Grade | null;
  schoolId: string;
  updatedAt: string;
}
