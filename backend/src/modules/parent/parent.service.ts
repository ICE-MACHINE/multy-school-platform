import { AppDataSource } from '../../config/data-source';
import { Parent } from './parent.entity';
import { Student } from '../student/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import { QuranProgress } from '../quranProgress/quranProgress.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { Payment } from '../payment/payment.entity';
import { Notification } from '../notification/notification.entity';
import { Message } from '../message/message.entity';
import { Conversation } from '../message/conversation.entity';
import { School } from '../school/school.entity';
import { Course } from '../course/course.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Lesson } from '../lesson/lesson.entity';
import { ProgramModule } from '../program/programModule.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { ApiError } from '../../shared/utils/ApiError';
import { clearLoginFailures, isLoginLocked, loginThrottleKey, recordLoginFailure } from '../../shared/utils/loginThrottle';
import { comparePassword } from '../../shared/utils/hash';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt';
import { encrypt, decrypt } from '../../shared/utils/encryption';

export class ParentService {
  constructor(
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly quranProgressRepo = AppDataSource.getRepository(QuranProgress),
    private readonly lessonProgressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly notificationRepo = AppDataSource.getRepository(Notification),
    private readonly messageRepo = AppDataSource.getRepository(Message),
    private readonly conversationRepo = AppDataSource.getRepository(Conversation),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly courseAttendanceRepo = AppDataSource.getRepository(CourseAttendance),
    private readonly courseSessionRepo = AppDataSource.getRepository(CourseSession),
    private readonly lessonRepo = AppDataSource.getRepository(Lesson),
    private readonly programModuleRepo = AppDataSource.getRepository(ProgramModule),
    private readonly schoolService: SchoolService = defaultSchoolService,
  ) {}

  async login(dto: { phone: string; password: string; schoolId: string }) {
    const throttleKey = loginThrottleKey(dto.phone, dto.schoolId || 'platform');
    if (isLoginLocked(throttleKey)) throw ApiError.tooMany('Too many failed login attempts; account is temporarily locked');
    const parent = await this.parentRepo.findOne({
      where: { phone: dto.phone, school: { id: dto.schoolId } },
      relations: ['school'],
    });

    if (!parent) {
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!parent.isActive) {
      throw ApiError.forbidden('الحساب معطّل');
    }

    const school = await this.schoolRepo.findOne({ where: { id: dto.schoolId } });
    if (school && school.isFrozen) {
      throw ApiError.forbidden('المدرسة مجمّدة');
    }

    const isPasswordValid = await comparePassword(dto.password, parent.password);
    if (!isPasswordValid) {
      recordLoginFailure(throttleKey);
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }
    clearLoginFailures(throttleKey);

    const tokenPayload = { id: parent.id, role: 'parent' as const, tv: parent.tokenVersion || 0, schoolId: dto.schoolId, slug: school?.slug };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        role: 'parent',
        schoolId: dto.schoolId,
        schoolSlug: school?.slug,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(id: string, schoolId: string) {
    const parent = await this.parentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!parent) {
      throw ApiError.notFound('ولي الأمر غير موجود');
    }

    const tokenPayload = { id: parent.id, role: 'parent' as const, tv: parent.tokenVersion || 0, schoolId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { accessToken, refreshToken };
  }

  async getChildren(schoolId: string, parentId: string) {
    return this.studentRepo.find({
      where: { parent: { id: parentId }, school: { id: schoolId } },
      relations: ['classroom'],
      select: ['id', 'firstName', 'lastName', 'registrationNumber', 'gender', 'classroomId'],
    });
  }

  async getChildProgress(schoolId: string, parentId: string, studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, parent: { id: parentId }, school: { id: schoolId } },
    });

    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });

    const quranProgress = await this.quranProgressRepo.find({
      where: { student: { id: studentId }, school: { id: schoolId } },
      relations: ['surah'],
    });

    const filteredProgress = quranProgress.filter(p => p.status !== 'not_reached');
    const juzCount = new Set(filteredProgress.filter(p => p.status === 'memorized').map(p => p.surah.juz)).size;

    const lessonProgress = await this.lessonProgressRepo.find({
      where: { student: { id: studentId } },
      relations: ['lesson'],
    });

    let courseProgress: any[] = [];

    if (school?.type === 'private') {
      const enrolledCourses = await this.courseRepo
        .createQueryBuilder('course')
        .innerJoin('course.enrolledStudents', 'student', 'student.id = :studentId', { studentId })
        .where('course.schoolId = :schoolId', { schoolId })
        .getMany();

      if (enrolledCourses.length > 0) {
        const courseIds = enrolledCourses.map(c => c.id);

        const allLessons = await this.lessonRepo
          .createQueryBuilder('lesson')
          .leftJoinAndSelect('lesson.programModule', 'programModule')
          .where('lesson.courseId IN (:...courseIds)', { courseIds })
          .orderBy('programModule.orderIndex', 'ASC')
          .addOrderBy('lesson.orderIndex', 'ASC')
          .getMany();

        const lessonIds = allLessons.map(l => l.id);
        const progressRecords = lessonIds.length > 0
          ? await this.lessonProgressRepo
              .createQueryBuilder('p')
              .where('p.studentId = :studentId AND p.lessonId IN (:...lessonIds)', { studentId, lessonIds })
              .getMany()
          : [];
        const progressMap = new Map(progressRecords.map(p => [p.lessonId, p]));

        const lessonsByCourse = new Map<string, typeof allLessons>();
        for (const lesson of allLessons) {
          if (!lessonsByCourse.has(lesson.courseId)) lessonsByCourse.set(lesson.courseId, []);
          lessonsByCourse.get(lesson.courseId)!.push(lesson);
        }

        // Find earliest attendance date per course for this student (enrollment proxy)
        const earliestAttendanceByCourse = new Map<string, string>();
        const firstAttendances = await this.courseAttendanceRepo
          .createQueryBuilder('ca')
          .select('ca.courseId', 'courseId')
          .addSelect('MIN(ca.date)', 'minDate')
          .where('ca.studentId = :studentId', { studentId })
          .andWhere('ca.courseId IN (:...courseIds)', { courseIds })
          .groupBy('ca.courseId')
          .getRawMany();
        for (const row of firstAttendances) {
          earliestAttendanceByCourse.set(row.courseId, row.minDate);
        }

        // For each lesson, find which session it belongs to and get session.completedAt
        const lessonSessionMap = new Map<string, string | null>();
        if (lessonIds.length > 0) {
          const lessonSessions = await this.courseSessionRepo
            .createQueryBuilder('cs')
            .innerJoin('cs.lessons', 'lesson', 'lesson.id IN (:...lessonIds)', { lessonIds })
            .select('lesson.id', 'lessonId')
            .addSelect('cs.completedAt', 'completedAt')
            .getRawMany();
          for (const row of lessonSessions) {
            if (row.completedAt && !lessonSessionMap.has(row.lessonId)) {
              lessonSessionMap.set(row.lessonId, row.completedAt);
            }
          }
        }

        courseProgress = enrolledCourses.map(course => {
          const lessons = lessonsByCourse.get(course.id) || [];
          const enrollmentDate = earliestAttendanceByCourse.get(course.id) || null;
          const moduleMap = new Map<string, { id: string; title: string; orderIndex: number; lessons: any[] }>();
          const ungroupedLessons: any[] = [];

          for (const lesson of lessons) {
            const progress = progressMap.get(lesson.id);
            const sessionCompletedAt = lessonSessionMap.get(lesson.id);

            let status = progress?.status || 'not_started';
            if (!progress && sessionCompletedAt && (!enrollmentDate || sessionCompletedAt < enrollmentDate)) {
              status = 'not_enrolled';
            }

            const lessonData = {
              id: lesson.id,
              title: lesson.title,
              orderIndex: lesson.orderIndex,
              status,
              completedAt: progress?.completedAt || null,
            };

            if (lesson.programModule) {
              if (!moduleMap.has(lesson.programModule.id)) {
                moduleMap.set(lesson.programModule.id, {
                  id: lesson.programModule.id,
                  title: lesson.programModule.title,
                  orderIndex: lesson.programModule.orderIndex,
                  lessons: [],
                });
              }
              moduleMap.get(lesson.programModule.id)!.lessons.push(lessonData);
            } else {
              ungroupedLessons.push(lessonData);
            }
          }

          const modules = Array.from(moduleMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);

          return {
            id: course.id,
            name: course.name,
            totalSessions: course.numberOfSessions,
            modules,
            ungroupedLessons,
          };
        });
      }
    }

    return {
      student,
      quranProgress: filteredProgress,
      juzCount,
      totalSurahsMemorized: filteredProgress.filter(p => p.status === 'memorized').length,
      totalSurahsMemorizing: filteredProgress.filter(p => p.status === 'memorizing').length,
      lessonProgress,
      courseProgress,
    };
  }

  async getChildAttendance(schoolId: string, parentId: string, studentId: string, month?: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, parent: { id: parentId }, school: { id: schoolId } },
    });

    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const qb = this.attendanceRepo.createQueryBuilder('attendance')
      .where('attendance.studentId = :studentId AND attendance.schoolId = :schoolId', { studentId, schoolId });

    if (month) {
      qb.andWhere("DATE_FORMAT(attendance.date, '%Y-%m') = :month", { month });
    }

    const records = await qb.orderBy('attendance.date', 'DESC').getMany();
    const totalDays = records.length;
    const absentDays = records.filter(r => r.isAbsent).length;
    const justifiedAbsences = records.filter(r => r.isAbsent && r.justified).length;

    return {
      records,
      summary: {
        totalDays,
        presentDays: totalDays - absentDays,
        absentDays,
        justifiedAbsences,
        unjustifiedAbsences: absentDays - justifiedAbsences,
      },
    };
  }

  async getNotifications(schoolId: string, parentId: string) {
    return this.notificationRepo.find({
      where: { recipientId: parentId, schoolId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getPayments(schoolId: string, parentId: string) {
    const children = await this.studentRepo.find({
      where: { parent: { id: parentId }, school: { id: schoolId } },
      select: ['id'],
    });

    const childIds = children.map(c => c.id);
    if (childIds.length === 0) return [];

    return this.paymentRepo.find({
      where: childIds.map(id => ({ student: { id }, school: { id: schoolId } })),
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async sendMessage(schoolId: string, data: any) {
    await this.schoolService.assertMessagesCapacity(schoolId);

    let conversationId = data.conversationId;
    if (!conversationId) {
      const existingConv = await this.conversationRepo.findOne({
        where: {
          teacherId: data.senderType === 'teacher' ? data.senderId : data.receiverId,
          parentId: data.senderType === 'parent' ? data.senderId : data.receiverId,
          studentId: data.studentId,
          schoolId,
        },
      });

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const conversation = this.conversationRepo.create({
          teacherId: data.senderType === 'teacher' ? data.senderId : data.receiverId,
          parentId: data.senderType === 'parent' ? data.senderId : data.receiverId,
          studentId: data.studentId,
          schoolId,
          lastMessageAt: new Date(),
        });
        const savedConv = await this.conversationRepo.save(conversation);
        conversationId = savedConv.id;
      }
    }

    const encryptedContent = encrypt(data.content);
    const message = this.messageRepo.create({
      ...data,
      content: encryptedContent,
      schoolId,
      conversationId,
    });

    await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });
    return this.messageRepo.save(message);
  }

  async getConversations(schoolId: string, parentId: string) {
    return this.conversationRepo.find({
      where: { parentId, schoolId },
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getConversationMessages(conversationId: string, parentId: string) {
    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });

    if (!conversation || conversation.parentId !== parentId) {
      throw ApiError.notFound('المحادثة غير موجودة');
    }

    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    return messages.map(m => ({
      ...m,
      content: decrypt(m.content),
    }));
  }

  async markNotificationsRead(schoolId: string, parentId: string) {
    await this.notificationRepo.update(
      { recipientId: parentId, schoolId, isRead: false },
      { isRead: true }
    );
  }

  async markMessagesRead(conversationId: string, parentId: string) {
    await this.messageRepo.update(
      { conversationId, receiverId: parentId, isRead: false },
      { isRead: true }
    );
  }
}

export const parentService = new ParentService();
