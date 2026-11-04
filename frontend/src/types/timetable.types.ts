export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface TimePeriod {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface TimetableSettings {
  id: string;
  schoolId: string;
  studyDays: DayOfWeek[];
  periods: TimePeriod[];
  createdAt: string;
  updatedAt: string;
}

export type SlotType = 'course' | 'activity' | 'classroom';

export interface TimetableSlot {
  id: string;
  schoolId: string;
  teacherId: string;
  teacher?: { id: string; firstName: string; lastName: string };
  day: DayOfWeek;
  periodId: string;
  type: SlotType;
  courseId?: string;
  course?: { id: string; name: string };
  activityId?: string;
  activity?: { id: string; title: string };
  classroomId?: string;
  classroom?: { id: string; name: string };
  startDate?: string;
  startTime: string;
  duration: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ScheduleChangeRequest {
  id: string;
  schoolId: string;
  teacherId: string;
  teacher?: { id: string; firstName: string; lastName: string };
  slotId: string;
  slot?: TimetableSlot;
  requestedDay?: DayOfWeek;
  requestedPeriodId?: string;
  reason?: string;
  status: RequestStatus;
  adminNote?: string;
  aiDecision?: 'approve' | 'reject' | 'manual_review' | null;
  aiConfidence?: number | null;
  aiReason?: string | null;
  aiProcessedAt?: string | null;
  autoProcessed?: boolean;
  constraintFeasible?: boolean | null;
  constraintViolations?: { code: string; message: string }[] | null;
  suggestedAlternatives?: { day: string; periodId: string; periodLabel?: string; startTime: string; endTime?: string; score: number }[] | null;
  agentRecommendation?: 'approve' | 'reject' | 'manual_review' | null;
  agentSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

export const SLOT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef', '#f472b6', '#fb923c', '#facc15',
  '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc',
];
