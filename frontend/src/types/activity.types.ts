export type ActivityCategory = 'physical' | 'creative' | 'cognitive' | 'social' | 'moral' | 'linguistic';
export type ActivityPeriod = 'morning' | 'afternoon';
export type ActivityStatus = 'planned' | 'completed';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  date: string;
  period: ActivityPeriod;
  status: ActivityStatus;
  startTime?: string;
  endTime?: string;
  location?: string;
  materials?: string;
  isActive: boolean;
  schoolId: string;
  teacherId?: string;
  teacher?: { id: string; firstName: string; lastName: string };
  classroomId?: string;
  classroom?: { id: string; name: string };
  participations?: StudentActivityParticipation[];
  createdAt: string;
}

export interface CreateActivityPayload {
  title: string;
  description?: string;
  category: ActivityCategory;
  date: string;
  period: ActivityPeriod;
  status?: ActivityStatus;
  completeToday?: boolean;
  startTime?: string;
  endTime?: string;
  location?: string;
  materials?: string;
  classroomId?: string;
}

export interface UpdateActivityPayload {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  date?: string;
  period?: ActivityPeriod;
  status?: ActivityStatus;
  completeToday?: boolean;
  startTime?: string;
  endTime?: string;
  location?: string;
  materials?: string;
  classroomId?: string;
}

export interface StudentActivityParticipation {
  id: string;
  activityId: string;
  studentId: string;
  participated: boolean;
  rating?: number;
  notes?: string;
  student?: { id: string; firstName: string; lastName: string; registrationNumber: string };
}

export interface StudentActivityProgress {
  status: ActivityStatus;
  participated: boolean | null;
  rating?: number | null;
  notes?: string | null;
  activity: {
    id: string;
    title: string;
    category: ActivityCategory;
    date: string;
    period: ActivityPeriod;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    materials?: string;
  };
}
