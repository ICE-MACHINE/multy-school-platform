import { AppDataSource } from '../../config/data-source';
import { TimetableSettings, TimePeriod } from './timetableSettings.entity';
import { TimetableSlot } from './timetableSlot.entity';
import { ScheduleChangeRequest } from './scheduleChangeRequest.entity';
import { Student } from '../student/student.entity';
import { SchoolAdmin } from '../schoolAdmin/schoolAdmin.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Course } from '../course/course.entity';
import { Notification } from '../notification/notification.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { constraintEngine, type ConstraintEvaluation, type TargetSlot } from './scheduling/constraintEngine';
import { loadSchedulingContext } from './scheduling/schedulingContext';
import { scheduleAutomationService } from '../ai/scheduleAutomation.service';
import { logger } from '../../shared/utils/logger';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function findPeriodForTime(periods: TimePeriod[], startTime: string): TimePeriod | undefined {
  const start = timeToMinutes(startTime);
  return periods.find(p => {
    const ps = timeToMinutes(p.startTime);
    const pe = timeToMinutes(p.endTime);
    return start >= ps && start < pe;
  });
}

const TEACHER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7',
];

function resolveTeacherColor(teacherId: string): string {
  let hash = 0;
  for (let i = 0; i < teacherId.length; i++) hash = teacherId.charCodeAt(i) + ((hash << 5) - hash);
  return TEACHER_COLORS[Math.abs(hash) % TEACHER_COLORS.length];
}

export class TimetableService {
  constructor(
    private readonly settingsRepo = AppDataSource.getRepository(TimetableSettings),
    private readonly slotRepo = AppDataSource.getRepository(TimetableSlot),
    private readonly requestRepo = AppDataSource.getRepository(ScheduleChangeRequest),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly adminRepo = AppDataSource.getRepository(SchoolAdmin),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly notifRepo = AppDataSource.getRepository(Notification),
  ) {}

  private async notify(schoolId: string, recipientId: string, recipientRole: string, title: string, message: string, type: string = 'schedule_change', link?: string) {
    const id = crypto.randomUUID();
    await this.notifRepo.query(
      'INSERT INTO notifications (id, title, message, type, recipientId, recipientRole, schoolId, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, message, type, recipientId, recipientRole, schoolId, link || null],
    );
  }

  private async assertMoveFeasible(schoolId: string, slot: TimetableSlot, target: TargetSlot): Promise<ConstraintEvaluation> {
    const ctx = await loadSchedulingContext(schoolId, slot);
    const evaluation = constraintEngine.evaluate(ctx, target);
    if (!evaluation.feasible) {
      throw ApiError.conflict(
        `Hard constraint violation(s): ${evaluation.violations.map(v => `${v.code}: ${v.message}`).join(' | ')}`,
      );
    }
    return evaluation;
  }

  private async getSchoolAdminId(schoolId: string): Promise<string | null> {
    const admin = await this.adminRepo.findOne({ where: { schoolId } });
    return admin?.id || null;
  }

  private async getAffectedParentIds(schoolId: string, slot: TimetableSlot): Promise<string[]> {
    const parentIds = new Set<string>();
    if (slot.classroomId) {
      const students = await this.studentRepo.find({ where: { schoolId, classroomId: slot.classroomId }, relations: ['parent'] });
      students.forEach(s => { if (s.parentId) parentIds.add(s.parentId); });
    }
    if (slot.courseId) {
      const students = await this.studentRepo.createQueryBuilder('student')
        .innerJoin('student.enrolledCourses', 'course', 'course.id = :courseId', { courseId: slot.courseId })
        .where('student.schoolId = :schoolId', { schoolId })
        .getMany();
      students.forEach(s => { if (s.parentId) parentIds.add(s.parentId); });
    }
    return Array.from(parentIds);
  }

  private async notifyParents(schoolId: string, slot: TimetableSlot, title: string, message: string, link?: string) {
    const parentIds = await this.getAffectedParentIds(schoolId, slot);
    for (const parentId of parentIds) {
      await this.notify(schoolId, parentId, 'parent', title, message, 'schedule_change', link);
    }
  }

  private validateSlotTime(settings: TimetableSettings, startTime: string, duration: number): { period: TimePeriod; endTime: string } {
    const period = findPeriodForTime(settings.periods, startTime);
    if (!period) throw ApiError.badRequest('وقت البداية لا ينتمي إلى أي فترة محددة');

    const startMin = timeToMinutes(startTime);
    const endMin = startMin + duration;
    const periodEnd = timeToMinutes(period.endTime);

    if (endMin > periodEnd) {
      throw ApiError.badRequest(
        `الحصة تتجاوز نهاية الفترة "${period.label}" (${period.startTime} - ${period.endTime})`
      );
    }

    return { period, endTime: minutesToTime(endMin) };
  }

  private async resolveSlotType(teacherId: string, schoolId: string): Promise<{ type: TimetableSlot['type']; courseId?: string; classroomId?: string }> {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw ApiError.notFound('المعلم غير موجود');

    if (teacher.classroomId) {
      return { type: 'classroom', classroomId: teacher.classroomId };
    }

    const course = await this.courseRepo.findOne({ where: { teacherId, schoolId } });
    if (course) {
      return { type: 'course', courseId: course.id };
    }

    throw ApiError.badRequest('المعلم غير مرتبط بدورة أو قسم');
  }

  async getSettings(schoolId: string) {
    let settings = await this.settingsRepo.findOne({ where: { schoolId } });
    if (!settings) {
      settings = this.settingsRepo.create({ schoolId, studyDays: [], periods: [] });
      settings = await this.settingsRepo.save(settings);
    }
    if (!settings.studyDays) settings.studyDays = [];
    if (!settings.periods) settings.periods = [];
    let changed = false;
    for (const p of settings.periods) {
      if (!p.id) { p.id = crypto.randomUUID(); changed = true; }
    }
    if (changed) await this.settingsRepo.save(settings);
    return settings;
  }

  async updateSettings(schoolId: string, payload: { studyDays?: string[]; periods?: { id: string; label: string; startTime: string; endTime: string }[] }) {
    let settings = await this.settingsRepo.findOne({ where: { schoolId } });
    if (!settings) {
      settings = this.settingsRepo.create({ schoolId, ...payload });
    } else {
      if (payload.studyDays !== undefined) settings.studyDays = payload.studyDays;
      if (payload.periods !== undefined) settings.periods = payload.periods;
    }
    return this.settingsRepo.save(settings);
  }

  async getSlots(schoolId: string, day?: string) {
    const where: any = { schoolId };
    if (day) where.day = day;
    return this.slotRepo.find({
      where,
      relations: ['teacher', 'course', 'activity', 'classroom'],
      order: { day: 'ASC', startTime: 'ASC' },
    });
  }

  async getMySlots(schoolId: string, teacherId: string) {
    return this.slotRepo.find({
      where: { schoolId, teacherId },
      relations: ['teacher', 'course', 'activity', 'classroom'],
      order: { day: 'ASC', startTime: 'ASC' },
    });
  }

  async getChildSlots(schoolId: string, studentId: string, parentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['classroom', 'parent', 'enrolledCourses'],
    });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');
    if (student.parentId !== parentId) throw ApiError.forbidden('ليس لديك صلاحية لعرض هذا التلميذ');

    const teacherIds = new Set<string>();
    if ((student.classroom as any)?.teacherId) teacherIds.add((student.classroom as any).teacherId);
    (student.enrolledCourses || []).forEach(c => { if (c.teacherId) teacherIds.add(c.teacherId); });

    const conditions: string[] = [];
    const params: Record<string, unknown> = { schoolId };
    if (student.classroomId) {
      conditions.push('slot.classroomId = :classroomId');
      params.classroomId = student.classroomId;
    }
    if (teacherIds.size) {
      conditions.push('slot.teacherId IN (:...teacherIds)');
      params.teacherIds = [...teacherIds];
    }
    if (!conditions.length) return [];

    const slots = await this.slotRepo.createQueryBuilder('slot')
      .leftJoinAndSelect('slot.teacher', 'teacher')
      .leftJoinAndSelect('slot.course', 'course')
      .leftJoinAndSelect('slot.activity', 'activity')
      .leftJoinAndSelect('slot.classroom', 'classroom')
      .where('slot.schoolId = :schoolId')
      .andWhere(`(${conditions.join(' OR ')})`)
      .setParameters(params)
      .orderBy('slot.day', 'ASC')
      .addOrderBy('slot.startTime', 'ASC')
      .getMany();

    return slots;

    return slots;
  }

  async createSlot(schoolId: string, payload: any) {
    const settings = await this.getSettings(schoolId);
    if (!settings.periods.length) throw ApiError.badRequest('لم تُعدّ الفترات بعد');

    const startTime = payload.startTime || '08:00';
    const duration = payload.duration || 60;
    const { period } = this.validateSlotTime(settings, startTime, duration);

    const { type, courseId, classroomId } = await this.resolveSlotType(payload.teacherId, schoolId);

    const existing = await this.slotRepo.findOne({
      where: { schoolId, day: payload.day, teacherId: payload.teacherId, startTime },
    });
    if (existing) throw ApiError.conflict('المعلم لديه خانة بالفعل في هذا اليوم والوقت');

    const slot = this.slotRepo.create({
      schoolId,
      teacherId: payload.teacherId,
      day: payload.day,
      periodId: period.id,
      type,
      courseId,
      classroomId,
      startTime,
      duration,
      color: resolveTeacherColor(payload.teacherId),
    });
    const saved = await this.slotRepo.save(slot);
    const sid = saved.schoolId;

    try {
      if (saved.teacherId) {
        await this.notify(sid, saved.teacherId, 'teacher', 'تحديث في الجدول الزمني', `تمت إضافة حصة جديدة لك — يوم ${saved.day} (${saved.startTime})`, 'schedule_change', '/teacher/timetable');
      }
      await this.notifyParents(sid, saved, 'تحديث في الجدول الزمني', `تمت إضافة حصة جديدة في جدول طفلك`, '/parent/timetable');
    } catch (e: any) {
      console.error('[createSlot] notification error:', e.message);
    }

    return saved;
  }

  async updateSlot(slotId: string, schoolId: string, payload: any) {
    const slot = await this.slotRepo.findOne({ where: { id: slotId, schoolId } });
    if (!slot) throw ApiError.notFound('الخانة غير موجودة');

    const effectiveTeacherId = payload.teacherId || slot.teacherId;

    if (payload.startTime || payload.duration) {
      const settings = await this.getSettings(schoolId);
      const startTime = payload.startTime || slot.startTime;
      const duration = payload.duration ?? slot.duration;
      const { period } = this.validateSlotTime(settings, startTime, duration);
      payload.periodId = period.id;
    }

    if (payload.teacherId || payload.startTime || payload.duration) {
      const resolved = await this.resolveSlotType(effectiveTeacherId, schoolId);
      payload.type = resolved.type;
      if (resolved.courseId) payload.courseId = resolved.courseId;
      if (resolved.classroomId) payload.classroomId = resolved.classroomId;
    }

    if (payload.teacherId) {
      payload.color = resolveTeacherColor(effectiveTeacherId);
    }

    Object.assign(slot, payload);
    const saved = await this.slotRepo.save(slot);
    const sid = saved.schoolId;

    try {
      if (saved.teacherId) {
        await this.notify(sid, saved.teacherId, 'teacher', 'تحديث في الجدول الزمني', `تم تعديل حصتك — يوم ${saved.day} (${saved.startTime})`, 'schedule_change', '/teacher/timetable');
      }
      await this.notifyParents(sid, saved, 'تحديث في الجدول الزمني', `تم تعديل حصة في جدول طفلك`, '/parent/timetable');
    } catch (e: any) {
      console.error('[updateSlot] notification error:', e.message);
    }

    return saved;
  }

  async deleteSlot(slotId: string, schoolId: string) {
    const slot = await this.slotRepo.findOne({ where: { id: slotId, schoolId } });
    if (!slot) throw ApiError.notFound('الخانة غير موجودة');

    const sid = slot.schoolId;

    try {
      if (slot.teacherId) {
        await this.notify(sid, slot.teacherId, 'teacher', 'حذف حصة من الجدول', `تم حذف حصة من جدولك — يوم ${slot.day} (${slot.startTime})`, 'schedule_change', '/teacher/timetable');
      }
      await this.notifyParents(sid, slot, 'حذف حصة من الجدول', `تم حذف حصة من جدول طفلك`, '/parent/timetable');
    } catch (e: any) {
      console.error('[deleteSlot] notification error:', e.message);
    }

    await this.requestRepo
      .createQueryBuilder()
      .delete()
      .where('slotId = :slotId', { slotId })
      .execute();

    await this.slotRepo.remove(slot);
  }

  async moveSlot(slotId: string, schoolId: string, payload: { day: string; periodId: string; startTime?: string }) {
    const slot = await this.slotRepo.findOne({ where: { id: slotId, schoolId } });
    if (!slot) throw ApiError.notFound('الخانة غير موجودة');

    const evaluation = await this.assertMoveFeasible(schoolId, slot, {
      day: payload.day,
      periodId: payload.periodId,
      startTime: payload.startTime,
    });
    if (!evaluation.target) throw ApiError.badRequest('الفترة المطلوبة غير موجودة');

    slot.day = evaluation.target.day;
    slot.periodId = evaluation.target.periodId;
    slot.startTime = evaluation.target.startTime;
    const saved = await this.slotRepo.save(slot);
    const sid = saved.schoolId;

    try {
      if (saved.teacherId) {
        await this.notify(sid, saved.teacherId, 'teacher', 'نقل حصة في الجدول', `تم نقل حصتك إلى يوم ${saved.day} (${saved.startTime})`, 'schedule_change', '/teacher/timetable');
      }
      await this.notifyParents(sid, saved, 'نقل حصة في الجدول', `تم نقل حصة في جدول طفلك`, '/parent/timetable');
    } catch (e: any) {
      console.error('[moveSlot] notification error:', e.message);
    }

    return saved;
  }

  async getChangeRequests(schoolId: string) {
    return this.requestRepo.createQueryBuilder('request')
      .leftJoinAndSelect('request.teacher', 'teacher')
      .leftJoinAndSelect('request.slot', 'slot')
      .leftJoinAndSelect('slot.course', 'course')
      .leftJoinAndSelect('slot.activity', 'activity')
      .leftJoinAndSelect('slot.classroom', 'classroom')
      .where('request.schoolId = :schoolId', { schoolId })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  async createChangeRequest(schoolId: string, teacherId: string, payload: any) {
    const request = this.requestRepo.create({ schoolId, teacherId, ...payload });
    const saved = await this.requestRepo.save(request);
    const savedRequest = saved as unknown as ScheduleChangeRequest;
    void scheduleAutomationService
      .evaluate(schoolId, savedRequest.id, { applyIfApproved: true })
      .catch((error) => {
        logger.error(
          `Schedule change request ${savedRequest.id} (school ${schoolId}) could not be analysed on creation; it will be retried by the pending-requests sweep`,
          error instanceof Error ? error : undefined,
        );
      });

    try {
      const adminId = await this.getSchoolAdminId(schoolId);
      if (adminId) {
        const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
        const name = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'معلم';
        const timeDesc = payload.requestedDay || payload.requestedPeriodId ? `اليوم ${payload.requestedDay || ''} ${payload.requestedPeriodId || ''}` : 'أي وقت آخر';
        await this.notify(schoolId, adminId, 'school_admin', 'طلب تغيير جدول', `المعلم ${name} يطلب تغيير حصة — الوقت المطلوب: ${timeDesc}`, 'schedule_change', '/admin/timetable');
      }
    } catch (e: any) {
      console.error('[createChangeRequest] notification error:', e.message);
    }

    return saved;
  }

  async handleRequest(requestId: string, schoolId: string, payload: { status: 'approved' | 'rejected'; adminNote?: string }) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, schoolId },
      relations: ['slot', 'teacher'],
    });
    if (!request) throw ApiError.notFound('الطلب غير موجود');

    request.status = payload.status;
    if (payload.adminNote) request.adminNote = payload.adminNote;

    let slotMoved = false;

    if (payload.status === 'approved' && request.slot && (request.requestedDay || request.requestedPeriodId)) {
      const slot = await this.slotRepo.findOne({ where: { id: request.slotId } });
      if (slot) {
        const targetDay = request.requestedDay || slot.day;
        const targetPeriodId = request.requestedPeriodId || slot.periodId;

        if (targetDay !== slot.day || targetPeriodId !== slot.periodId) {
          const evaluation = await this.assertMoveFeasible(schoolId, slot, {
            day: targetDay,
            periodId: targetPeriodId,
          });
          if (evaluation.target) slot.startTime = evaluation.target.startTime;
        }

        if (request.requestedDay) slot.day = request.requestedDay;
        if (request.requestedPeriodId) slot.periodId = request.requestedPeriodId;
        await this.slotRepo.save(slot);
        slotMoved = true;
      }
    }

    const saved = await this.requestRepo.save(request);

    try {
      if (request.teacherId) {
        const statusText = payload.status === 'approved' ? 'تمت الموافقة على' : 'تم رفض';
        await this.notify(schoolId, request.teacherId, 'teacher', `${statusText} طلب التغيير`, `${statusText} طلب تغيير الجدول ${payload.adminNote ? '— ملاحظة: ' + payload.adminNote : ''}`, 'schedule_change', '/teacher/timetable');
      }

      if (payload.status === 'approved' && slotMoved && request.slot) {
        await this.notifyParents(schoolId, request.slot, 'تم تعديل جدول طفلك', `تم نقل حصة في جدول طفلك وفقاً لطلب تغيير معتمد`, '/parent/timetable');
      }
    } catch (e: any) {
      console.error('[handleRequest] notification error:', e.message);
    }

    return saved;
  }

  async cleanupOldRequests(schoolId: string) {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.requestRepo
      .createQueryBuilder()
      .delete()
      .where('schoolId = :schoolId AND createdAt < :cutoff', {
        schoolId,
        cutoff,
      })
      .execute();
    return { deleted: result.affected || 0 };
  }
}

export const timetableService = new TimetableService();
