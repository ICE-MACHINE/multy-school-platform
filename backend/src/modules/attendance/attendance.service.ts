import { AppDataSource } from '../../config/data-source';
import { Attendance } from './attendance.entity';
import { ActivityService, activityService as defaultActivityService } from '../activity/activity.service';
import { NotificationService, notificationService as defaultNotificationService } from '../notification/notification.service';
import { ApiError } from '../../shared/utils/ApiError';

const DEFAULT_PERIOD = 'morning';

interface AttendanceFilters {
  date?: string;
  from?: string;
  to?: string;
  period?: string;
  studentId?: string;
  isAbsent?: string;
  justified?: string;
  search?: string;
}

const toBool = (value: string | undefined) =>
  value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : undefined;

export class AttendanceService {
  constructor(
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly activityService: ActivityService = defaultActivityService,
    private readonly notificationService: NotificationService = defaultNotificationService,
  ) {}

  async getAll(schoolId: string, page = 1, limit = 20, filters: AttendanceFilters = {}) {
    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .where('attendance.schoolId = :schoolId', { schoolId });

    if (filters.date) {
      qb.andWhere('attendance.date = :date', { date: filters.date });
    }
    if (filters.from) {
      qb.andWhere('attendance.date >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('attendance.date <= :to', { to: filters.to });
    }
    if (filters.period) {
      qb.andWhere('attendance.period = :period', { period: filters.period });
    }
    if (filters.studentId) {
      qb.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });
    }
    const isAbsent = toBool(filters.isAbsent);
    if (isAbsent !== undefined) {
      qb.andWhere('attendance.isAbsent = :isAbsent', { isAbsent });
    }
    const justified = toBool(filters.justified);
    if (justified !== undefined) {
      qb.andWhere('attendance.justified = :justified', { justified });
    }
    if (filters.search) {
      const search = `%${filters.search}%`;
      qb.andWhere('(student.firstName LIKE :search OR student.lastName LIKE :search OR CONCAT(student.firstName, " ", student.lastName) LIKE :search)', { search });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.period', 'ASC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSummary(schoolId: string, filters: AttendanceFilters = {}) {
    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .where('attendance.schoolId = :schoolId', { schoolId });

    if (filters.date) {
      qb.andWhere('attendance.date = :date', { date: filters.date });
    }
    if (filters.from) {
      qb.andWhere('attendance.date >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('attendance.date <= :to', { to: filters.to });
    }
    if (filters.period) {
      qb.andWhere('attendance.period = :period', { period: filters.period });
    }
    if (filters.studentId) {
      qb.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });
    }
    const isAbsent = toBool(filters.isAbsent);
    if (isAbsent !== undefined) {
      qb.andWhere('attendance.isAbsent = :isAbsent', { isAbsent });
    }

    const rows = await qb.getMany();
    const totalRecords = rows.length;
    const absentCount = rows.filter((r) => r.isAbsent).length;
    const presentCount = totalRecords - absentCount;
    const justifiedAbsences = rows.filter((r) => r.isAbsent && r.justified).length;
    const unjustifiedAbsences = rows.filter((r) => r.isAbsent && !r.justified).length;

    return {
      totalRecords,
      presentCount,
      absentCount,
      justifiedAbsences,
      unjustifiedAbsences,
      attendanceRate: totalRecords > 0 ? Number(((presentCount / totalRecords) * 100).toFixed(1)) : 0,
    };
  }

  async create(schoolId: string, data: any) {
    const period = data.period || DEFAULT_PERIOD;
    const existing = await this.attendanceRepo.findOne({
      where: {
        school: { id: schoolId },
        student: { id: data.studentId },
        date: data.date,
        period,
      },
    });

    if (existing) {
      throw ApiError.conflict('تم تسجيل حضور هذا التلميذ في هذا التاريخ والفترة مسبقاً');
    }

    const attendance = { ...data, period, schoolId } as Attendance;
    const saved = await this.attendanceRepo.save(attendance);
    const activitySync = await this.activityService.syncForStudent(schoolId, saved.studentId!, saved.date, saved.period, saved.isAbsent);
    if (saved.isAbsent) {
      await this.notificationService.createAbsenceNotificationForStudent(saved.studentId!, schoolId, saved.date);
    }
    return { ...saved, activitySync };
  }

  async bulkCreate(schoolId: string, records: any[]) {
    const results = [];
    for (const record of records) {
      const period = record.period || DEFAULT_PERIOD;
      const existing = await this.attendanceRepo.findOne({
        where: {
          school: { id: schoolId },
          student: { id: record.studentId },
          date: record.date,
          period,
        },
      });

      if (existing) {
        if (record.isAbsent && !existing.isAbsent) {
          existing.isAbsent = true;
          existing.justified = record.justified || false;
          existing.justification = record.justification;
          existing.period = period;
          const saved = await this.attendanceRepo.save(existing);
          const activitySync = await this.activityService.syncForStudent(schoolId, saved.studentId!, saved.date, saved.period, saved.isAbsent);
          results.push({ ...saved, activitySync });
          await this.notificationService.createAbsenceNotificationForStudent(saved.studentId!, schoolId, saved.date);
        } else {
          results.push(existing);
        }
      } else {
        const attendance = { ...record, period, schoolId } as Attendance;
        const saved = await this.attendanceRepo.save(attendance);
        const activitySync = await this.activityService.syncForStudent(schoolId, saved.studentId!, saved.date, saved.period, saved.isAbsent);
        results.push({ ...saved, activitySync });
        if (saved.isAbsent) {
          await this.notificationService.createAbsenceNotificationForStudent(saved.studentId!, schoolId, saved.date);
        }
      }
    }
    return results;
  }

  async update(id: string, schoolId: string, data: any) {
    const attendance = await this.attendanceRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!attendance) {
      throw ApiError.notFound('سجل الحضور غير موجود');
    }
    Object.assign(attendance, data);
    const saved = await this.attendanceRepo.save(attendance);
    const activitySync = await this.activityService.syncForStudent(schoolId, saved.studentId!, saved.date, saved.period, saved.isAbsent);
    if (saved.isAbsent) {
      await this.notificationService.createAbsenceNotificationForStudent(saved.studentId!, schoolId, saved.date);
    }
    return { ...saved, activitySync };
  }

  async delete(id: string, schoolId: string) {
    const attendance = await this.attendanceRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!attendance) {
      throw ApiError.notFound('سجل الحضور غير موجود');
    }
    const { studentId, date, period } = attendance;
    await this.attendanceRepo.remove(attendance);
    await this.activityService.syncForStudent(schoolId, studentId!, date, period, false);
  }

  async justify(id: string, schoolId: string, justification: string) {
    const attendance = await this.attendanceRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!attendance) {
      throw ApiError.notFound('سجل الحضور غير موجود');
    }
    if (!attendance.isAbsent) {
      throw ApiError.badRequest('لا يمكن تبرير غياب تلميذ حاضر');
    }
    attendance.justified = true;
    attendance.justification = justification;
    return this.attendanceRepo.save(attendance);
  }

  async getStudentAttendance(studentId: string, schoolId: string, month?: string) {
    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .where('attendance.studentId = :studentId AND attendance.schoolId = :schoolId', { studentId, schoolId });

    if (month) {
      qb.andWhere("DATE_FORMAT(attendance.date, '%Y-%m') = :month", { month });
    }

    const records = await qb.orderBy('attendance.date', 'DESC').getMany();
    const totalDays = records.length;
    const absentDays = records.filter(r => r.isAbsent).length;

    return {
      records,
      summary: {
        totalDays,
        presentDays: totalDays - absentDays,
        absentDays,
        justifiedAbsences: records.filter(r => r.isAbsent && r.justified).length,
        unjustifiedAbsences: records.filter(r => r.isAbsent && !r.justified).length,
      },
    };
  }

  async getAbsenceCounts(schoolId: string, month?: string) {
    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .select('attendance.studentId', 'studentId')
      .addSelect('COUNT(*)', 'totalAbsences')
      .addSelect('SUM(CASE WHEN attendance.justified = 1 THEN 1 ELSE 0 END)', 'justifiedAbsences')
      .where('attendance.schoolId = :schoolId AND attendance.isAbsent = 1', { schoolId });

    if (month) {
      qb.andWhere("DATE_FORMAT(attendance.date, '%Y-%m') = :month", { month });
    }

    qb.groupBy('attendance.studentId');

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      studentId: r.studentId,
      totalAbsences: Number(r.totalAbsences),
      unjustifiedAbsences: Number(r.totalAbsences) - Number(r.justifiedAbsences),
    }));
  }

  async getMonthlyStats(schoolId: string, month: string) {
    const records = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .where("attendance.schoolId = :schoolId AND DATE_FORMAT(attendance.date, '%Y-%m') = :month", { schoolId, month })
      .getMany();

    const totalRecords = records.length;
    const absentCount = records.filter(r => r.isAbsent).length;

    return {
      month,
      totalRecords,
      presentCount: totalRecords - absentCount,
      absentCount,
      attendanceRate: totalRecords > 0 ? ((totalRecords - absentCount) / totalRecords * 100).toFixed(1) : '0',
    };
  }
}

export const attendanceService = new AttendanceService();
