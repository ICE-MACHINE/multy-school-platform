import { AppDataSource } from '../../config/data-source';
import { Notification } from './notification.entity';
import { Student } from '../student/student.entity';
import { School } from '../school/school.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { classifyNotificationPriority, notificationGroupKey } from './notificationIntelligence';

export class NotificationService {
  constructor(
    private readonly notificationRepo = AppDataSource.getRepository(Notification),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly schoolRepo = AppDataSource.getRepository(School),
  ) {}

  async getAll(schoolId: string, recipientId: string, page = 1, limit = 20) {
    const qb = this.notificationRepo.createQueryBuilder('notification')
      .where('notification.schoolId = :schoolId AND notification.recipientId = :recipientId', { schoolId, recipientId });

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('notification.createdAt', 'DESC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: any) {
    const enriched = { ...data };
    if (!enriched.priority && enriched.type && enriched.title) {
      enriched.priority = classifyNotificationPriority({
        type: enriched.type,
        title: enriched.title,
        message: enriched.message || '',
      });
    }
    if (!enriched.groupKey && enriched.recipientId && enriched.type) {
      enriched.groupKey = notificationGroupKey({
        id: '',
        type: enriched.type,
        title: enriched.title || '',
        message: enriched.message || '',
        link: enriched.link,
        isRead: false,
        createdAt: new Date(),
        recipientId: enriched.recipientId,
      });
    }
    const recentDuplicate = enriched.recipientId
      ? await this.notificationRepo
          .createQueryBuilder('notification')
          .where('notification.schoolId = :schoolId', { schoolId: enriched.schoolId })
          .andWhere('notification.recipientId = :recipientId', { recipientId: enriched.recipientId })
          .andWhere('notification.groupKey = :groupKey', { groupKey: enriched.groupKey })
          .andWhere('notification.createdAt >= :since', {
            since: new Date(Date.now() - 60 * 60 * 1000),
          })
          .getOne()
          .catch(() => null)
      : null;
    if (recentDuplicate) return recentDuplicate;
    const notification = this.notificationRepo.create(enriched);
    return this.notificationRepo.save(notification);
  }

  async markAsRead(id: string, recipientId: string, schoolId?: string) {
    const notification = await this.notificationRepo.findOne({
      where: schoolId ? { id, recipientId, schoolId } : { id, recipientId },
    });
    if (!notification) {
      throw ApiError.notFound('الإشعار غير موجود');
    }
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(recipientId: string, schoolId: string) {
    await this.notificationRepo.update(
      { recipientId, schoolId, isRead: false },
      { isRead: true }
    );
  }

  async delete(id: string, recipientId: string, schoolId?: string) {
    const notification = await this.notificationRepo.findOne({
      where: schoolId ? { id, recipientId, schoolId } : { id, recipientId },
    });
    if (!notification) {
      throw ApiError.notFound('الإشعار غير موجود');
    }
    await this.notificationRepo.remove(notification);
  }

  async getUnreadCount(recipientId: string, schoolId: string) {
    const count = await this.notificationRepo.count({
      where: { recipientId, schoolId, isRead: false },
    });
    return { unreadCount: count };
  }

  private async getSchoolSlug(schoolId: string): Promise<string> {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    return school?.slug || schoolId;
  }

  async createAbsenceNotification(studentName: string, date: string, parentId: string, schoolId: string, studentId: string) {
    const slug = await this.getSchoolSlug(schoolId);
    return this.create({
      title: 'تم تسجيل غياب',
      message: `تم تسجيل غياب التلميذ(ة) ${studentName} يوم ${date}`,
      type: 'absence',
      recipientId: parentId,
      recipientRole: 'parent',
      schoolId,
      link: `/s/${slug}/parent/${studentId}/attendance`,
    });
  }

  async createAbsenceNotificationForStudent(studentId: string, schoolId: string, date: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['parent'],
    });
    if (!student || !student.parentId) {
      return null;
    }
    return this.createAbsenceNotification(
      `${student.firstName} ${student.lastName}`,
      date,
      student.parentId,
      schoolId,
      student.id
    );
  }

  async createCourseAbsenceNotificationForStudent(studentId: string, schoolId: string, date: string, courseName: string, periodLabel: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['parent'],
    });
    if (!student || !student.parentId) {
      return null;
    }
    const slug = await this.getSchoolSlug(schoolId);
    return this.create({
      title: 'تم تسجيل غياب',
      message: `تم تسجيل غياب التلميذ(ة) ${student.firstName} ${student.lastName} عن دورة "${courseName}" يوم ${date} (${periodLabel})`,
      type: 'absence',
      recipientId: student.parentId,
      recipientRole: 'parent',
      schoolId,
      link: `/s/${slug}/parent/${student.id}/attendance`,
    });
  }

  async createPaymentNotification(studentName: string, amount: number, month: string, parentId: string, schoolId: string) {
    return this.create({
      title: 'تم تسجيل دفعة',
      message: `تم تسجيل دفعة بمبلغ ${amount} دج للتلميذ(ة) ${studentName} عن شهر ${month}`,
      type: 'payment',
      recipientId: parentId,
      recipientRole: 'parent',
      schoolId,
    });
  }

  async createMessageNotification(senderName: string, receiverId: string, recipientRole: string, schoolId: string, conversationId: string) {
    const slug = await this.getSchoolSlug(schoolId);
    const rolePath = recipientRole === 'school_admin' ? 'admin' : recipientRole === 'teacher' ? 'teacher' : 'parent';
    return this.create({
      title: 'رسالة جديدة',
      message: `لديك رسالة جديدة من ${senderName}`,
      type: 'message',
      recipientId: receiverId,
      recipientRole,
      schoolId,
      link: `/s/${slug}/${rolePath}/messages?conversation=${conversationId}`,
    });
  }

  async createActivityStatusNotificationForParent(parentId: string, studentId: string, schoolId: string, studentName: string, activityTitle: string, date: string, periodLabel: string, isAbsent: boolean) {
    const slug = await this.getSchoolSlug(schoolId);
    return this.create({
      title: 'تحديث حالة نشاط',
      message: `تغيّرت حالة حضور ${studentName} في النشاط "${activityTitle}" بتاريخ ${date} (${periodLabel}) — ${isAbsent ? 'أصبح غائباً عنه' : 'أصبح حاضراً'}.`,
      type: 'activity',
      recipientId: parentId,
      recipientRole: 'parent',
      schoolId,
      link: `/s/${slug}/parent/${studentId}/progress`,
    });
  }
}

export const notificationService = new NotificationService();
