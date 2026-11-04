import { AppDataSource } from '../../config/data-source';
import { Attendance } from '../attendance/attendance.entity';
import { Notification } from '../notification/notification.entity';
import { Student } from '../student/student.entity';
import { scopedWhere } from '../../shared/tenant/tenantScope';
import {
  buildNotificationDigest,
  classifyNotificationPriority,
  groupNotifications,
  suggestSendTime,
  type NotificationDigest,
  type NotificationGroup,
} from '../notification/notificationIntelligence';

export interface AdminIntervention {
  studentId: string;
  studentName: string;
  code: 'repeated_unjustified_absences' | 'unread_absence_notifications';
  count: number;
  detail: string;
}

export class NotificationIntelligenceService {
  async getDigest(
    schoolId: string,
    recipientId: string,
    periodDays = 7,
  ): Promise<NotificationDigest> {
    const repo = AppDataSource.getRepository(Notification);
    const rows = await repo.find({
      where: scopedWhere(schoolId, { recipientId }),
      order: { createdAt: 'DESC' },
      take: 500,
    });
    return buildNotificationDigest(rows, periodDays);
  }

  async getGrouped(
    schoolId: string,
    recipientId: string,
  ): Promise<{ groups: NotificationGroup[]; duplicatesCollapsed: number }> {
    const repo = AppDataSource.getRepository(Notification);
    const rows = await repo.find({
      where: scopedWhere(schoolId, { recipientId }),
      order: { createdAt: 'DESC' },
      take: 500,
    });
    const groups = groupNotifications(rows);
    return { groups, duplicatesCollapsed: rows.length - groups.length };
  }

  async getAdminOverview(schoolId: string): Promise<{
    interventions: AdminIntervention[];
    sendTimePolicy: ReturnType<typeof suggestSendTime>;
    generatedAt: string;
  }> {
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const studentRepo = AppDataSource.getRepository(Student);

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const rows = await attendanceRepo
      .createQueryBuilder('attendance')
      .select('attendance.studentId', 'studentId')
      .addSelect('COUNT(*)', 'count')
      .where('attendance.schoolId = :schoolId', { schoolId })
      .andWhere('attendance.isAbsent = 1')
      .andWhere('attendance.justified = 0')
      .andWhere('attendance.date >= :since', { since })
      .groupBy('attendance.studentId')
      .having('COUNT(*) >= 3')
      .getRawMany();

    const interventions: AdminIntervention[] = [];
    for (const row of rows as Array<Record<string, unknown>>) {
      if (typeof row.studentId !== 'string') continue;
      const student = await studentRepo.findOne({
        where: scopedWhere(schoolId, { id: row.studentId }),
      });
      interventions.push({
        studentId: row.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : row.studentId,
        code: 'repeated_unjustified_absences',
        count: Number(row.count) || 0,
        detail: `${Number(row.count) || 0} unjustified absences in the last 14 days`,
      });
    }

    const unreadAbsences = await notificationRepo.count({
      where: scopedWhere(schoolId, { type: 'absence' as Notification['type'], isRead: false }),
    });
    if (unreadAbsences >= 5) {
      interventions.push({
        studentId: '',
        studentName: '',
        code: 'unread_absence_notifications',
        count: unreadAbsences,
        detail: `${unreadAbsences} unread absence notifications across the school`,
      });
    }

    return {
      interventions,
      sendTimePolicy: suggestSendTime(classifyNotificationPriority({ type: 'general', title: '', message: '' })),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const notificationIntelligenceService = new NotificationIntelligenceService();
