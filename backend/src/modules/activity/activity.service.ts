import { AppDataSource } from '../../config/data-source';
import { Activity } from './activity.entity';
import { StudentActivityParticipation } from './participation.entity';
import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';
import { School } from '../school/school.entity';
import { Attendance } from '../attendance/attendance.entity';
import { NotificationService, notificationService as defaultNotificationService } from '../notification/notification.service';
import { ApiError } from '../../shared/utils/ApiError';

const PERIOD_LABELS: Record<string, string> = { morning: 'صباحية', afternoon: 'مسائية' };

function todayStr(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

function autoPeriod(): 'morning' | 'afternoon' {
  return new Date().getHours() < 12 ? 'morning' : 'afternoon';
}

const COMPLETION_IMMUTABLE_FIELDS = ['date', 'period', 'classroomId', 'status', 'teacherId', 'schoolId'] as const;

export class ActivityService {
  constructor(
    private readonly activityRepo = AppDataSource.getRepository(Activity),
    private readonly participationRepo = AppDataSource.getRepository(StudentActivityParticipation),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly notificationService: NotificationService = defaultNotificationService,
  ) {}

  private async assertKindergarten(schoolId: string): Promise<School> {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    if (school.type !== 'kindergarten') {
      throw ApiError.forbidden('الأنشطة متاحة لرياض الأطفال فقط');
    }
    return school;
  }

  private async assertTeacherClassroom(schoolId: string, teacherId: string): Promise<Teacher> {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['classroom'],
    });
    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }
    if (!teacher.classroom) {
      throw ApiError.forbidden('المعلم غير معيّن على قسم');
    }
    return teacher;
  }

  private async findOwnedActivity(id: string, schoolId: string, teacherId?: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['teacher', 'classroom'],
    });
    if (!activity) {
      throw ApiError.notFound('النشاط غير موجود');
    }
    if (teacherId && activity.teacherId !== teacherId) {
      throw ApiError.forbidden('ليس لديك صلاحية للوصول إلى هذا النشاط');
    }
    return activity;
  }

  async getAll(schoolId: string, page = 1, limit = 20, date?: string, period?: string, teacherId?: string, status?: string) {
    const qb = this.activityRepo.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.teacher', 'teacher')
      .leftJoinAndSelect('activity.classroom', 'classroom')
      .leftJoinAndSelect('activity.participations', 'participations')
      .leftJoinAndSelect('participations.student', 'participationStudent')
      .where('activity.schoolId = :schoolId', { schoolId });

    if (date) {
      qb.andWhere('activity.date = :date', { date });
    }
    if (period) {
      qb.andWhere('activity.period = :period', { period });
    }
    if (status) {
      qb.andWhere('activity.status = :status', { status });
    }
    if (teacherId) {
      const teacher = await this.teacherRepo.findOne({
        where: { id: teacherId, school: { id: schoolId } },
        relations: ['classroom'],
      });
      if (!teacher || !teacher.classroom) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      qb.andWhere('activity.teacherId = :teacherId', { teacherId });
      qb.andWhere('activity.classroomId = :classroomId', { classroomId: teacher.classroomId });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('activity.date', 'DESC')
      .addOrderBy('activity.period', 'ASC')
      .addOrderBy('activity.createdAt', 'DESC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string, schoolId: string, teacherId?: string) {
    const activity = await this.activityRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['teacher', 'classroom', 'participations', 'participations.student'],
    });
    if (!activity) {
      throw ApiError.notFound('النشاط غير موجود');
    }
    if (teacherId && activity.teacherId !== teacherId) {
      throw ApiError.forbidden('ليس لديك صلاحية للوصول إلى هذا النشاط');
    }
    return activity;
  }

  async create(schoolId: string, teacherId: string, data: any) {
    await this.assertKindergarten(schoolId);
    const teacher = await this.assertTeacherClassroom(schoolId, teacherId);

    const classroomId = data.classroomId || teacher.classroomId;
    if (classroomId !== teacher.classroomId) {
      throw ApiError.forbidden('لا يمكنك إضافة نشاط لقاعة غير قاعتك');
    }

    const completeToday = !!data.completeToday;
    const status = completeToday || data.status === 'completed' ? 'completed' : 'planned';

    let date = data.date;
    let period = data.period;
    if (completeToday) {
      date = todayStr();
      period = data.period || autoPeriod();
    }
    if (!date) {
      throw ApiError.badRequest('تاريخ النشاط مطلوب');
    }
    if (!period) {
      period = 'morning';
    }

    const activity = this.activityRepo.create({
      title: data.title,
      description: data.description || null,
      category: data.category || 'cognitive',
      date,
      period,
      status,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      location: data.location || null,
      materials: data.materials || null,
      schoolId,
      teacherId,
      classroomId,
      isActive: true,
    } as Activity);
    const saved = await this.activityRepo.save(activity);

    if (saved.status === 'completed') {
      await this.linkParticipations(saved, schoolId);
    }
    return this.getById(saved.id, schoolId);
  }

  async update(id: string, schoolId: string, teacherId: string, data: any) {
    const activity = await this.findOwnedActivity(id, schoolId, teacherId);

    if (activity.status === 'completed') {
      const restricted = COMPLETION_IMMUTABLE_FIELDS.filter(
        (field) => field in data && data[field] !== undefined && String(data[field]) !== String(activity[field])
      );
      if (restricted.length > 0) {
        throw ApiError.badRequest('لا يمكن تعديل تاريخ أو فترة أو قاعة نشاط مكتمل');
      }
    }

    const editable = {
      title: data.title ?? activity.title,
      description: data.description !== undefined ? data.description : activity.description,
      category: data.category ?? activity.category,
      startTime: data.startTime !== undefined ? data.startTime : activity.startTime,
      endTime: data.endTime !== undefined ? data.endTime : activity.endTime,
      location: data.location !== undefined ? data.location : activity.location,
      materials: data.materials !== undefined ? data.materials : activity.materials,
    };
    Object.assign(activity, editable);

    const saved = await this.activityRepo.save(activity);
    if (saved.status === 'completed') {
      await this.linkParticipations(saved, schoolId);
    }
    return this.getById(saved.id, schoolId);
  }

  async complete(id: string, schoolId: string, teacherId: string, data?: { date?: string; period?: string }) {
    const activity = await this.findOwnedActivity(id, schoolId, teacherId);

    if (activity.status === 'completed') {
      return { activity: await this.getById(activity.id, schoolId), alreadyCompleted: true };
    }

    activity.status = 'completed';
    activity.date = data?.date || todayStr();
    activity.period = (data?.period as Activity['period']) || autoPeriod();

    const saved = await this.activityRepo.save(activity);
    await this.linkParticipations(saved, schoolId);
    return { activity: await this.getById(saved.id, schoolId), alreadyCompleted: false };
  }

  async delete(id: string, schoolId: string, teacherId: string) {
    const activity = await this.findOwnedActivity(id, schoolId, teacherId);
    await this.activityRepo.remove(activity);
  }

  async getParticipations(activityId: string, schoolId: string, teacherId?: string) {
    const activity = await this.findOwnedActivity(activityId, schoolId, teacherId);

    return this.participationRepo.find({
      where: { activity: { id: activityId } },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  async markParticipation(activityId: string, schoolId: string, studentId: string, data: { participated: boolean; rating?: number; notes?: string }, teacherId?: string) {
    const activity = await this.findOwnedActivity(activityId, schoolId, teacherId);
    if (activity.status !== 'completed') {
      throw ApiError.badRequest('لا يمكن تسجيل مشاركة في نشاط لم يكتمل بعد');
    }

    const student = await this.studentRepo.findOne({ where: { id: studentId, school: { id: schoolId } } });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');

    let participation = await this.participationRepo.findOne({ where: { activity: { id: activityId }, student: { id: studentId } } });
    if (participation) {
      Object.assign(participation, data);
    } else {
      participation = this.participationRepo.create({ activityId, studentId, ...data });
    }
    return this.participationRepo.save(participation);
  }

  async bulkMarkParticipation(activityId: string, schoolId: string, records: { studentId: string; participated: boolean; rating?: number; notes?: string }[], teacherId?: string) {
    const activity = await this.findOwnedActivity(activityId, schoolId, teacherId);
    if (activity.status !== 'completed') {
      throw ApiError.badRequest('لا يمكن تسجيل مشاركات في نشاط لم يكتمل بعد');
    }

    const results: StudentActivityParticipation[] = [];
    for (const record of records) {
      const r = await this.markParticipation(activityId, schoolId, record.studentId, record, teacherId);
      results.push(r);
    }
    return results;
  }

  async getStudentProgress(schoolId: string, studentId: string, userId: string, role: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['classroom'],
    });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');
    if (role === 'parent' && student.parentId !== userId) {
      throw ApiError.forbidden('ليس لديك صلاحية للوصول إلى هذا التلميذ');
    }

    const participations = await this.participationRepo.createQueryBuilder('participation')
      .leftJoinAndSelect('participation.activity', 'activity')
      .leftJoinAndSelect('activity.teacher', 'teacher')
      .leftJoinAndSelect('activity.classroom', 'classroom')
      .where('participation.studentId = :studentId AND activity.schoolId = :schoolId', { studentId, schoolId })
      .orderBy('activity.date', 'DESC')
      .addOrderBy('activity.period', 'ASC')
      .getMany();

    let plannedActivities: Activity[] = [];
    if (student.classroomId) {
      plannedActivities = await this.activityRepo.find({
        where: {
          school: { id: schoolId },
          classroom: { id: student.classroomId },
          status: 'planned',
        },
        relations: ['teacher', 'classroom'],
        order: { date: 'ASC' },
      });
    }

    const linkedActivityIds = new Set(participations.map((p) => p.activityId));

    const records = [
      ...participations.map((p) => ({
        status: 'completed' as const,
        participated: p.participated,
        rating: p.rating ?? null,
        notes: p.notes ?? null,
        activity: {
          id: p.activity.id,
          title: p.activity.title,
          category: p.activity.category,
          date: p.activity.date,
          period: p.activity.period,
          description: p.activity.description,
          startTime: p.activity.startTime,
          endTime: p.activity.endTime,
          location: p.activity.location,
          materials: p.activity.materials,
        },
      })),
      ...plannedActivities
        .filter((a) => !linkedActivityIds.has(a.id))
        .map((a) => ({
          status: 'planned' as const,
          participated: null,
          rating: null,
          notes: null,
          activity: {
            id: a.id,
            title: a.title,
            category: a.category,
            date: a.date,
            period: a.period,
            description: a.description,
            startTime: a.startTime,
            endTime: a.endTime,
            location: a.location,
            materials: a.materials,
          },
        })),
    ].sort((a, b) => {
      if (a.activity.date !== b.activity.date) return b.activity.date.localeCompare(a.activity.date);
      return a.activity.period.localeCompare(b.activity.period);
    });

    const completed = participations.filter((p) => p.participated).length;
    const missed = participations.filter((p) => !p.participated).length;

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        registrationNumber: student.registrationNumber,
      },
      totalActivities: records.length,
      completedActivities: completed,
      missedActivities: missed,
      plannedActivities: records.filter((r) => r.status === 'planned').length,
      records,
    };
  }

  async syncForStudent(schoolId: string, studentId: string, date: string, period: string, isAbsent: boolean) {
    const participations = await this.participationRepo.createQueryBuilder('participation')
      .leftJoinAndSelect('participation.activity', 'activity')
      .where(
        'participation.studentId = :studentId AND activity.schoolId = :schoolId ' +
        'AND activity.status = :status AND activity.date = :date AND activity.period = :period',
        { studentId, schoolId, status: 'completed', date, period }
      )
      .getMany();
    if (participations.length === 0) return { changed: false, affected: [] };

    const affected = new Set<string>();
    const participated = !isAbsent;
    for (const participation of participations) {
      if (participation.participated !== participated) {
        participation.participated = participated;
        await this.participationRepo.save(participation);
        if (participation.activity?.title) {
          affected.add(participation.activity.title);
        }
      }
    }
    if (affected.size === 0) return { changed: false, affected: [] };

    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['parent'],
    });
    const studentName = student ? `${student.firstName} ${student.lastName}` : 'التلميذ';
    const periodLabel = PERIOD_LABELS[period] || period;
    for (const title of affected) {
      if (student?.parentId) {
        await this.notificationService.createActivityStatusNotificationForParent(
          student.parentId,
          studentId,
          schoolId,
          studentName,
          title,
          date,
          periodLabel,
          isAbsent
        );
      }
    }
    return { changed: true, affected: [...affected] };
  }

  async linkParticipations(activity: Activity, schoolId: string) {
    if (!activity.classroomId) return 0;

    const students = await this.studentRepo.find({
      where: { classroom: { id: activity.classroomId }, school: { id: schoolId }, isActive: true },
    });

    let count = 0;
    for (const student of students) {
      const attendance = await this.attendanceRepo.findOne({
        where: { student: { id: student.id }, date: activity.date, period: activity.period },
      });
      const participated = attendance ? !attendance.isAbsent : true;

      let participation = await this.participationRepo.findOne({
        where: { activity: { id: activity.id }, student: { id: student.id } },
      });
      if (participation) {
        if (participation.participated !== participated) {
          participation.participated = participated;
          await this.participationRepo.save(participation);
        }
      } else {
        participation = this.participationRepo.create({ activityId: activity.id, studentId: student.id, participated });
        await this.participationRepo.save(participation);
      }
      count += 1;
    }
    return count;
  }
}

export const activityService = new ActivityService();
