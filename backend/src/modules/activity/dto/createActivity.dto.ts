import type { ActivityCategory, ActivityPeriod, ActivityStatus } from '../activity.entity';

export interface CreateActivityDTO {
  title: string;
  description?: string;
  category?: ActivityCategory;
  date: string;
  period?: ActivityPeriod;
  status?: ActivityStatus;
  completeToday?: boolean;
  startTime?: string;
  endTime?: string;
  location?: string;
  materials?: string;
  classroomId?: string;
}
