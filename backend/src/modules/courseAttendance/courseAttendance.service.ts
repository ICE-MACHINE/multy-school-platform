import { AppDataSource } from '../../config/data-source';
import { CourseAttendance } from './courseAttendance.entity';
import { Course } from '../course/course.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Student } from '../student/student.entity';
import { School } from '../school/school.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { NotificationService, notificationService as defaultNotificationService } from '../notification/notification.service';
import { ApiError } from '../../shared/utils/ApiError';

export type AttendancePeriod = 'morning' | 'afternoon';

const PERIOD_LABELS: Record<AttendancePeriod, string> = { morning: 'صباحية', afternoon: 'مسائية' };

function autoPeriod(): AttendancePeriod {
  return new Date().getHours() < 12 ? 'morning' : 'afternoon';
}

export function periodLabel(period: string): string {
  return PERIOD_LABELS[period as AttendancePeriod] || period;
}

interface AuthUser {
  id: string;
  role: 'school_admin' | 'teacher' | 'parent' | 'super_admin';
  schoolId?: string;
}

interface AttendanceFilters {
  date?: string;
  from?: string;
  to?: string;
  period?: string;
  month?: string;
  studentId?: string;
  isAbsent?: string;
  justified?: string;
  search?: string;
}

const toBool = (value: string | undefined) =>
  value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : undefined;

export class CourseAttendanceService {
  constructor(
    private readonly attendanceRepo = AppDataSource.getRepository(CourseAttendance),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly sessionRepo = AppDataSource.getRepository(CourseSession),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly progressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly notificationService: NotificationService = defaultNotificationService,
  ) {}

  private async assertPrivate(schoolId: string): Promise<void> {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    if (school.type !== 'private') {
      throw ApiError.forbidden('الحضور حسب الدورات متاح في المدارس الخاصة فقط');
    }
  }

  private async assertCourseAccess(courseId: string, schoolId: string, user: AuthUser): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('الدورة غير موجودة');
    }
    if (user.role === 'teacher' && course.teacherId !== user.id) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
    return course;
  }

  private async findCompletedSession(courseId: string, sessionNumber: number): Promise<CourseSession> {
    const session = await this.sessionRepo.findOne({ where: { courseId, sessionNumber } });
    if (!session) {
      throw ApiError.notFound('الحصة غير موجودة');
    }
    if (!session.completedAt) {
      throw ApiError.badRequest('لا يمكن تسجيل الحضور في حصة لم تُكمَل بعد');
    }
    return session;
  }

  /**
   * Creates a حضور/غياب record per enrolled student whenever a session is
   * completed. Mirrors how kindergarten activities link participations.
   */
  async linkSessionAttendance(courseId: string, sessionId: string, date: string, period: AttendancePeriod, schoolId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['enrolledStudents'],
    });
    const students = (course?.enrolledStudents || []).filter((s) => s.isActive !== false);
    let count = 0;
    for (const student of students) {
      const existing = await this.attendanceRepo.findOne({
        where: { courseId, sessionId, studentId: student.id },
      });
      if (existing) {
        if (existing.date !== date || existing.period !== period) {
          existing.date = date;
          existing.period = period;
          await this.attendanceRepo.save(existing);
        }
      } else {
        await this.attendanceRepo.save(
          this.attendanceRepo.create({
            courseId,
            sessionId,
            studentId: student.id,
            date,
            period,
            isAbsent: false,
            justified: false,
            schoolId,
          })
        );
        count += 1;
      }
    }
    return { count };
  }

  async syncSessionDates(sessionId: string, date: string | null, period: AttendancePeriod | string | null) {
    if (!date) return;
    await this.attendanceRepo.createQueryBuilder()
      .update(CourseAttendance)
      .set({ date, period: (period as AttendancePeriod) || 'morning' })
      .where('sessionId = :sessionId', { sessionId })
      .execute();
  }

  async removeSessionAttendance(sessionId: string) {
    await this.attendanceRepo.delete({ sessionId });
  }

  async getBySession(courseId: string, sessionNumber: number, schoolId: string, user: AuthUser) {
    await this.assertPrivate(schoolId);
    await this.assertCourseAccess(courseId, schoolId, user);
    const session = await this.sessionRepo.findOne({
      where: { courseId, sessionNumber },
      relations: ['lessons'],
    });
    if (!session) {
      throw ApiError.notFound('الحصة غير موجودة');
    }
    const attendance = await this.attendanceRepo.find({
      where: { courseId, sessionId: session.id },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
    return {
      sessionNumber,
      date: session.completedAt,
      period: session.period,
      lessons: session.lessons || [],
      attendance,
    };
  }

  async getAll(courseId: string, schoolId: string, user: AuthUser, filters: AttendanceFilters = {}, page = 1, limit = 20) {
    await this.assertPrivate(schoolId);
    await this.assertCourseAccess(courseId, schoolId, user);

    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .where('attendance.courseId = :courseId', { courseId });

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
    if (filters.month) {
      qb.andWhere("DATE_FORMAT(attendance.date, '%Y-%m') = :month", { month: filters.month });
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
      .addOrderBy('attendance.createdAt', 'DESC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSummary(courseId: string, schoolId: string, user: AuthUser, filters: AttendanceFilters = {}) {
    await this.assertPrivate(schoolId);
    await this.assertCourseAccess(courseId, schoolId, user);

    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .where('attendance.courseId = :courseId', { courseId });
    if (filters.date) qb.andWhere('attendance.date = :date', { date: filters.date });
    if (filters.from) qb.andWhere('attendance.date >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('attendance.date <= :to', { to: filters.to });
    if (filters.period) qb.andWhere('attendance.period = :period', { period: filters.period });
    if (filters.month) qb.andWhere("DATE_FORMAT(attendance.date, '%Y-%m') = :month", { month: filters.month });
    if (filters.studentId) qb.andWhere('attendance.studentId = :studentId', { studentId: filters.studentId });

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

  private async notifyAbsenceIfNeeded(courseId: string, studentId: string, schoolId: string, date: string, period: AttendancePeriod, course?: Course) {
    const c = course || await this.courseRepo.findOne({ where: { id: courseId } });
    if (!c || !c.name) return;
    await this.notificationService.createCourseAbsenceNotificationForStudent(
      studentId,
      schoolId,
      date,
      c.name,
      PERIOD_LABELS[period] || period,
    );
  }

  /**
   * After an attendance record changes for a student in a session,
   * update StudentLessonProgress for all lessons in that session.
   */
  private async syncLessonProgress(sessionId: string, studentId: string, isAbsent: boolean) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['lessons'],
    });
    if (!session?.lessons?.length) return;

    for (const lesson of session.lessons) {
      const existing = await this.progressRepo.findOne({
        where: { studentId, lessonId: lesson.id },
      });
      if (existing) {
        if (existing.status === 'not_started' || (isAbsent && existing.status === 'completed') || (!isAbsent && existing.status === 'absent')) {
          existing.status = isAbsent ? 'absent' : 'completed';
          existing.completedAt = isAbsent ? null : session.completedAt;
          await this.progressRepo.save(existing);
        }
      } else {
        await this.progressRepo.save(this.progressRepo.create({
          studentId,
          lessonId: lesson.id,
          status: isAbsent ? 'absent' : 'completed',
          completedAt: isAbsent ? null : session.completedAt,
        }));
      }
    }
  }

  async upsert(courseId: string, schoolId: string, user: AuthUser, data: { sessionNumber: number; studentId: string; isAbsent: boolean; justification?: string }) {
    await this.assertPrivate(schoolId);
    const course = await this.assertCourseAccess(courseId, schoolId, user);
    const session = await this.findCompletedSession(courseId, Number(data.sessionNumber));

    const student = await this.studentRepo.findOne({ where: { id: data.studentId, school: { id: schoolId } } });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');
    const courseWithStudents = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['enrolledStudents'],
    });
    const enrolled = (courseWithStudents?.enrolledStudents || []).some((s) => s.id === data.studentId);
    if (!enrolled) throw ApiError.badRequest('التلميذ غير مسجّل في هذه الدورة');

    const isAbsent = !!data.isAbsent;
    let record = await this.attendanceRepo.findOne({
      where: { courseId, sessionId: session.id, studentId: data.studentId },
    });

    let newlyAbsent = false;
    if (record) {
      newlyAbsent = isAbsent && !record.isAbsent;
      record.isAbsent = isAbsent;
      record.recordedById = user.id;
      if (!isAbsent) {
        record.justified = false;
        record.justification = '';
      }
    } else {
      record = this.attendanceRepo.create({
        courseId,
        sessionId: session.id,
        studentId: data.studentId,
        date: session.completedAt as string,
        period: session.period,
        isAbsent,
        justified: false,
        justification: data.justification || undefined,
        recordedById: user.id,
        schoolId,
      });
      newlyAbsent = isAbsent;
    }
    const saved = await this.attendanceRepo.save(record);
    if (newlyAbsent) {
      await this.notifyAbsenceIfNeeded(courseId, data.studentId, schoolId, saved.date, saved.period, course);
    }
    await this.syncLessonProgress(session.id, data.studentId, isAbsent);
    return this.attendanceRepo.findOne({ where: { id: saved.id }, relations: ['student'] });
  }

  async bulkUpsert(courseId: string, schoolId: string, user: AuthUser, data: { sessionNumber: number; records: { studentId: string; isAbsent: boolean }[] }) {
    await this.assertPrivate(schoolId);
    const session = await this.findCompletedSession(courseId, Number(data.sessionNumber));

    const course = await this.assertCourseAccess(courseId, schoolId, user);
    const courseWithStudents = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['enrolledStudents'],
    });
    const enrolledIds = new Set((courseWithStudents?.enrolledStudents || []).map((s) => s.id));

    const results: CourseAttendance[] = [];
    for (const record of data.records) {
      if (!enrolledIds.has(record.studentId)) continue;
      const isAbsent = !!record.isAbsent;
      let existing = await this.attendanceRepo.findOne({
        where: { courseId, sessionId: session.id, studentId: record.studentId },
      });
      let newlyAbsent = false;
      if (existing) {
        newlyAbsent = isAbsent && !existing.isAbsent;
        existing.isAbsent = isAbsent;
        existing.recordedById = user.id;
        if (!isAbsent) {
          existing.justified = false;
          existing.justification = '';
        }
      } else {
        existing = this.attendanceRepo.create({
          courseId,
          sessionId: session.id,
          studentId: record.studentId,
          date: session.completedAt as string,
          period: session.period,
          isAbsent,
          justified: false,
          recordedById: user.id,
          schoolId,
        });
        newlyAbsent = isAbsent;
      }
      const saved = await this.attendanceRepo.save(existing);
      if (newlyAbsent) {
        await this.notifyAbsenceIfNeeded(courseId, record.studentId, schoolId, saved.date, saved.period, course);
      }
      await this.syncLessonProgress(session.id, record.studentId, isAbsent);
      results.push(saved);
    }
    return results;
  }

  async update(id: string, schoolId: string, user: AuthUser, data: { isAbsent?: boolean; justification?: string }) {
    await this.assertPrivate(schoolId);
    const record = await this.attendanceRepo.findOne({ where: { id, schoolId } });
    if (!record) throw ApiError.notFound('سجل الحضور غير موجود');
    const course = await this.assertCourseAccess(record.courseId, schoolId, user);

    const isAbsent = data.isAbsent !== undefined ? !!data.isAbsent : record.isAbsent;
    const newlyAbsent = isAbsent && !record.isAbsent;
    record.isAbsent = isAbsent;
    if (data.justification !== undefined) record.justification = data.justification;
    if (!isAbsent) {
      record.justified = false;
      record.justification = '';
    }
    record.recordedById = user.id;
    const saved = await this.attendanceRepo.save(record);
    if (newlyAbsent) {
      await this.notifyAbsenceIfNeeded(record.courseId, record.studentId!, schoolId, saved.date, saved.period, course);
    }
    return this.attendanceRepo.findOne({ where: { id: saved.id }, relations: ['student'] });
  }

  async justify(id: string, schoolId: string, user: AuthUser, justification: string) {
    await this.assertPrivate(schoolId);
    const record = await this.attendanceRepo.findOne({ where: { id, schoolId } });
    if (!record) throw ApiError.notFound('سجل الحضور غير موجود');
    await this.assertCourseAccess(record.courseId, schoolId, user);
    if (!record.isAbsent) {
      throw ApiError.badRequest('لا يمكن تبرير غياب تلميذ حاضر');
    }
    record.justified = true;
    record.justification = justification;
    const saved = await this.attendanceRepo.save(record);
    return this.attendanceRepo.findOne({ where: { id: saved.id }, relations: ['student'] });
  }

  async remove(id: string, schoolId: string, user: AuthUser) {
    await this.assertPrivate(schoolId);
    const record = await this.attendanceRepo.findOne({ where: { id, schoolId } });
    if (!record) throw ApiError.notFound('سجل الحضور غير موجود');
    await this.assertCourseAccess(record.courseId, schoolId, user);
    await this.attendanceRepo.remove(record);
    return { success: true };
  }

  /**
   * For the parent view (and admin/teacher): a student's attendance across
   * all the courses they are enrolled in, grouped per course.
   */
  async getStudentCourseAttendance(studentId: string, schoolId: string, user: AuthUser, month?: string) {
    await this.assertPrivate(schoolId);

    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['parent'],
    });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');
    if (user.role === 'parent' && student.parentId !== user.id) {
      throw ApiError.forbidden('ليس لديك صلاحية للوصول إلى هذا التلميذ');
    }

    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.course', 'course')
      .leftJoinAndSelect('attendance.session', 'session')
      .where('attendance.studentId = :studentId AND attendance.schoolId = :schoolId', { studentId, schoolId });

    if (user.role === 'teacher') {
      qb.andWhere('course.teacherId = :teacherId', { teacherId: user.id });
    }
    if (month) {
      qb.andWhere("DATE_FORMAT(attendance.date, '%Y-%m') = :month", { month });
    }

    const records = await qb.orderBy('attendance.date', 'DESC').addOrderBy('course.name', 'ASC').getMany();

    const grouped = new Map<string, CourseAttendance[]>();
    for (const r of records) {
      if (!grouped.has(r.courseId)) grouped.set(r.courseId, []);
      grouped.get(r.courseId)!.push(r);
    }

    const courses = Array.from(grouped.entries()).map(([courseId, rows]) => {
      const total = rows.length;
      const absent = rows.filter((r) => r.isAbsent).length;
      const justified = rows.filter((r) => r.isAbsent && r.justified).length;
      return {
        courseId,
        courseName: rows[0].course?.name || 'دورة',
        records: rows,
        summary: {
          totalDays: total,
          presentDays: total - absent,
          absentDays: absent,
          justifiedAbsences: justified,
          unjustifiedAbsences: absent - justified,
        },
      };
    });

    const all = records;
    const totalAbsent = all.filter((r) => r.isAbsent).length;
    const totalJustified = all.filter((r) => r.isAbsent && r.justified).length;

    return {
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName, registrationNumber: student.registrationNumber },
      courses,
      summary: {
        totalRecords: all.length,
        absentDays: totalAbsent,
        justifiedAbsences: totalJustified,
        unjustifiedAbsences: totalAbsent - totalJustified,
      },
    };
  }

  async getStudentCourseDetail(studentId: string, courseId: string, schoolId: string, user: AuthUser) {
    await this.assertPrivate(schoolId);
    const course = await this.assertCourseAccess(courseId, schoolId, user);

    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
    });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');
    if (user.role === 'parent' && student.parentId !== user.id) {
      throw ApiError.forbidden('ليس لديك صلاحية للوصول إلى هذا التلميذ');
    }

    const enrolled = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['enrolledStudents'],
    });
    if (!enrolled?.enrolledStudents?.some((s) => s.id === studentId)) {
      throw ApiError.badRequest('التلميذ غير مسجّل في هذه الدورة');
    }

    const sessions = await this.sessionRepo.find({
      where: { courseId },
      relations: ['lessons'],
      order: { sessionNumber: 'ASC' },
    });

    const completedSessions = sessions.filter((s) => s.completedAt);

    const attendanceRecords = await this.attendanceRepo.find({
      where: { courseId, studentId },
      order: { date: 'ASC' },
    });

    const attendanceBySession = new Map(attendanceRecords.map((a) => [a.sessionId, a]));

    const totalSessions = completedSessions.length;
    const absentCount = attendanceRecords.filter((a) => a.isAbsent).length;
    const justifiedCount = attendanceRecords.filter((a) => a.isAbsent && a.justified).length;

    return {
      course: { id: course.id, name: course.name, teacherId: course.teacherId },
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName, registrationNumber: student.registrationNumber },
      sessions: completedSessions.map((s) => {
        const att = attendanceBySession.get(s.id);
        return {
          sessionNumber: s.sessionNumber,
          date: s.completedAt,
          period: s.period,
          lessons: s.lessons || [],
          attendance: att ? { isAbsent: att.isAbsent, justified: att.justified, justification: att.justification || null } : null,
        };
      }),
      summary: {
        totalSessions,
        presentDays: totalSessions - absentCount,
        absentDays: absentCount,
        justifiedAbsences: justifiedCount,
        unjustifiedAbsences: absentCount - justifiedCount,
        attendanceRate: totalSessions > 0 ? Number((((totalSessions - absentCount) / totalSessions) * 100).toFixed(1)) : 0,
      },
    };
  }
}

export const courseAttendanceService = new CourseAttendanceService();
