import type { ActivityPeriod } from './activity.types';

export interface Attendance {
  id: string;
  date: string;
  period: ActivityPeriod;
  isAbsent: boolean;
  justified: boolean;
  justification?: string;
  studentId: string;
  schoolId: string;
  recordedById?: string;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string; registrationNumber: string };
  activitySync?: { changed: boolean; affected: string[] };
}

export interface CreateAttendancePayload {
  studentId: string;
  date: string;
  period: ActivityPeriod;
  isAbsent?: boolean;
}

export interface UpdateAttendancePayload {
  isAbsent?: boolean;
  period?: ActivityPeriod;
}

export interface BulkAttendancePayload {
  date: string;
  period: ActivityPeriod;
  records: { studentId: string; isAbsent: boolean }[];
}

export interface JustifyAttendancePayload {
  justification: string;
}
