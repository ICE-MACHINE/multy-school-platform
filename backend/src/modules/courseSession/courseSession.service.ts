import { AppDataSource } from '../../config/data-source';
import { CourseSession } from './courseSession.entity';
import { Course } from '../course/course.entity';
import { Lesson } from '../lesson/lesson.entity';
import { Student } from '../student/student.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { courseAttendanceService } from '../courseAttendance/courseAttendance.service';
import { ApiError } from '../../shared/utils/ApiError';

interface AuthUser {
  id: string;
  role: 'school_admin' | 'teacher' | 'parent' | 'super_admin';
  schoolId?: string;
}

type SessionPeriod = 'morning' | 'afternoon';

function autoPeriod(): SessionPeriod {
  return new Date().getHours() < 12 ? 'morning' : 'afternoon';
}

export class CourseSessionService {
  constructor(
    private readonly sessionRepo = AppDataSource.getRepository(CourseSession),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly lessonRepo = AppDataSource.getRepository(Lesson),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly progressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly attendanceRepo = AppDataSource.getRepository(CourseAttendance),
  ) {}

  private async assertCourseAccess(courseId: string, schoolId: string, user: AuthUser) {
    const course = await this.courseRepo.findOne({ where: { id: courseId, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('الدورة غير موجودة');
    }
    if (user.role === 'teacher' && course.teacherId !== user.id) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
    return course;
  }

  private async assertLessonsBelongToCourse(lessonIds: string[], courseId: string) {
    if (!lessonIds || lessonIds.length === 0) {
      throw ApiError.badRequest('يجب اختيار درس واحد على الأقل يتم إعطاؤه في الحصة');
    }
    const lessons = await this.lessonRepo.find({
      where: lessonIds.map((id) => ({ id, courseId })),
    });
    if (lessons.length !== lessonIds.length) {
      throw ApiError.badRequest('أحد الدروس المختارة لا يتبع هذه الدورة');
    }
    return lessons;
  }

  async getSessions(courseId: string, schoolId: string, user: AuthUser) {
    await this.assertCourseAccess(courseId, schoolId, user);
    const sessions = await this.sessionRepo.find({
      where: { courseId },
      relations: ['lessons'],
      order: { sessionNumber: 'ASC' },
    });
    return sessions.map((s) => ({
      ...s,
      completed: Boolean(s.completedAt),
    }));
  }

  /**
   * Marks a session as completed and attaches the lessons taught in it.
   * Also creates a حضور/格會 record per enrolled student (private schools).
   * Auto-creates StudentLessonProgress for each lesson × student.
   */
  async completeSession(courseId: string, schoolId: string, data: { sessionNumber: number; completedAt?: string; period?: SessionPeriod; lessonIds: string[] }, user: AuthUser) {
    const course = await this.assertCourseAccess(courseId, schoolId, user);

    const sessionNumber = Number(data.sessionNumber);
    if (!Number.isInteger(sessionNumber) || sessionNumber < 1) {
      throw ApiError.badRequest('يجب تحديد رقم الحصة');
    }
    const totalSessions = Number(course.numberOfSessions || 0);
    if (totalSessions > 0 && sessionNumber > totalSessions) {
      throw ApiError.badRequest(`رقم الحصة يجب أن يكون بين 1 و ${totalSessions}`);
    }

    const lessons = await this.assertLessonsBelongToCourse(data.lessonIds, courseId);
    const completedAt = data.completedAt || new Date().toISOString().split('T')[0];
    const period = (data.period as SessionPeriod) || autoPeriod();

    let session = await this.sessionRepo.findOne({ where: { courseId, sessionNumber } });
    if (!session) {
      session = this.sessionRepo.create({ courseId, sessionNumber });
    }
    session.completedAt = completedAt;
    session.period = period;
    session.lessons = lessons;
    const saved = await this.sessionRepo.save(session);

    await courseAttendanceService.linkSessionAttendance(courseId, saved.id, completedAt, period, schoolId);
    await this.syncLessonProgressForSession(saved.id, courseId, lessons, completedAt);
    return saved;
  }

  async updateSession(courseId: string, schoolId: string, sessionNumber: number, data: any, user: AuthUser) {
    await this.assertCourseAccess(courseId, schoolId, user);
    const session = await this.sessionRepo.findOne({
      where: { courseId, sessionNumber },
      relations: ['lessons'],
    });
    if (!session) {
      throw ApiError.notFound('الحصة غير موجودة');
    }

    if (data.lessonIds !== undefined) {
      session.lessons = await this.assertLessonsBelongToCourse(data.lessonIds, courseId);
    }
    if (data.completedAt !== undefined) {
      session.completedAt = data.completedAt || null;
    }
    if (data.period !== undefined) {
      session.period = (data.period as SessionPeriod) || 'morning';
    }
    if (data.notes !== undefined) {
      session.notes = data.notes;
    }
    const saved = await this.sessionRepo.save(session);
    if (saved.completedAt) {
      await courseAttendanceService.syncSessionDates(saved.id, saved.completedAt, saved.period);
    }
    return saved;
  }

  /**
   * Removes the session record / marks it as not completed.
   */
  async deleteSession(courseId: string, schoolId: string, sessionNumber: number, user: AuthUser) {
    await this.assertCourseAccess(courseId, schoolId, user);
    const session = await this.sessionRepo.findOne({
      where: { courseId, sessionNumber },
      relations: ['lessons'],
    });
    if (!session) {
      throw ApiError.notFound('الحصة غير موجودة');
    }
    if (session.lessons?.length) {
      await this.resetLessonProgressForSession(session.lessons, session.id);
    }
    await courseAttendanceService.removeSessionAttendance(session.id);
    await this.sessionRepo.remove(session);
    return { success: true };
  }

  /**
   * Returns the set of session numbers already marked as completed by the teacher.
   */
  async getCompletedSessionNumbers(courseId: string): Promise<Set<number>> {
    const rows = await this.sessionRepo.find({
      where: { courseId },
      select: ['sessionNumber', 'completedAt'],
    });
    return new Set(rows.filter((r) => r.completedAt).map((r) => Number(r.sessionNumber)));
  }

  /**
   * Bulk variant used by payment-status computations: courseId → completed session numbers.
   */
  async getCompletedSessionNumbersByCourses(courseIds: string[]): Promise<Map<string, Set<number>>> {
    const map = new Map<string, Set<number>>();
    if (courseIds.length === 0) return map;
    const rows = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.courseId IN (:...courseIds)', { courseIds })
      .andWhere('session.completedAt IS NOT NULL')
      .select(['session.courseId', 'session.sessionNumber'])
      .getMany();
    for (const r of rows) {
      if (!map.has(r.courseId)) map.set(r.courseId, new Set());
      map.get(r.courseId)!.add(Number(r.sessionNumber));
    }
    return map;
  }

  /**
   * For each lesson × enrolled student in a completed session,
   * create/update StudentLessonProgress: present→completed, absent→absent.
   */
  private async syncLessonProgressForSession(
    sessionId: string,
    courseId: string,
    lessons: Lesson[],
    completedAt: string,
  ) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['enrolledStudents'],
    });
    const students = (course?.enrolledStudents || []).filter((s) => s.isActive !== false);
    if (!students.length || !lessons.length) return;

    const attendanceRows = await this.attendanceRepo.find({
      where: { sessionId },
      select: ['studentId', 'isAbsent'],
    });
    const absentIds = new Set(attendanceRows.filter((a) => a.isAbsent).map((a) => a.studentId));

    for (const lesson of lessons) {
      for (const student of students) {
        const existing = await this.progressRepo.findOne({
          where: { studentId: student.id, lessonId: lesson.id },
        });
        const isAbsent = absentIds.has(student.id);
        const newStatus = isAbsent ? 'absent' as const : 'completed' as const;

        if (existing) {
          if (existing.status === 'not_started') {
            existing.status = newStatus;
            existing.completedAt = isAbsent ? null : completedAt;
            await this.progressRepo.save(existing);
          }
        } else {
          await this.progressRepo.save(this.progressRepo.create({
            studentId: student.id,
            lessonId: lesson.id,
            status: newStatus,
            completedAt: isAbsent ? null : completedAt,
          }));
        }
      }
    }
  }

  /**
   * Reset StudentLessonProgress back to not_started for lessons in a deleted session.
   */
  private async resetLessonProgressForSession(lessons: Lesson[], sessionId: string) {
    for (const lesson of lessons) {
      const progressRows = await this.progressRepo.find({
        where: { lessonId: lesson.id },
      });
      for (const p of progressRows) {
        if (p.status !== 'not_started') {
          p.status = 'not_started';
          p.completedAt = null;
          await this.progressRepo.save(p);
        }
      }
    }
  }
}

export const courseSessionService = new CourseSessionService();
