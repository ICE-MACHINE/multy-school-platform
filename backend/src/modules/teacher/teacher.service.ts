import { AppDataSource } from '../../config/data-source';
import { Teacher } from './teacher.entity';
import { Student } from '../student/student.entity';
import { Classroom } from '../classroom/classroom.entity';
import { Course } from '../course/course.entity';
import { Attendance } from '../attendance/attendance.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { QuranProgress } from '../quranProgress/quranProgress.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { Message } from '../message/message.entity';
import { Conversation } from '../message/conversation.entity';
import { School } from '../school/school.entity';
import { ActivityService, activityService as defaultActivityService } from '../activity/activity.service';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { ApiError } from '../../shared/utils/ApiError';
import { clearLoginFailures, isLoginLocked, loginThrottleKey, recordLoginFailure } from '../../shared/utils/loginThrottle';
import { comparePassword } from '../../shared/utils/hash';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt';
import { encrypt } from '../../shared/utils/encryption';

export class TeacherService {
  constructor(
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly courseAttendanceRepo = AppDataSource.getRepository(CourseAttendance),
    private readonly quranProgressRepo = AppDataSource.getRepository(QuranProgress),
    private readonly lessonProgressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly messageRepo = AppDataSource.getRepository(Message),
    private readonly conversationRepo = AppDataSource.getRepository(Conversation),
    private readonly schoolService: SchoolService = defaultSchoolService,
    private readonly activityService: ActivityService = defaultActivityService,
  ) {}

  async login(dto: { phone: string; password: string; schoolId: string }) {
    const throttleKey = loginThrottleKey(dto.phone, dto.schoolId || 'platform');
    if (isLoginLocked(throttleKey)) throw ApiError.tooMany('Too many failed login attempts; account is temporarily locked');
    const teacher = await this.teacherRepo.findOne({
      where: { phone: dto.phone, school: { id: dto.schoolId } },
      relations: ['school'],
    });

    if (!teacher) {
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!teacher.isActive) {
      throw ApiError.forbidden('الحساب معطّل');
    }

    const school = await this.schoolRepo.findOne({ where: { id: dto.schoolId } });
    if (school && school.isFrozen) {
      throw ApiError.forbidden('المدرسة مجمّدة');
    }

    const isPasswordValid = await comparePassword(dto.password, teacher.password);
    if (!isPasswordValid) {
      recordLoginFailure(throttleKey);
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }
    clearLoginFailures(throttleKey);

    const tokenPayload = { id: teacher.id, role: 'teacher' as const, tv: teacher.tokenVersion || 0, schoolId: dto.schoolId, slug: school?.slug };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        role: 'teacher',
        schoolId: dto.schoolId,
        schoolSlug: school?.slug,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(id: string, schoolId: string) {
    const teacher = await this.teacherRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }

    const tokenPayload = { id: teacher.id, role: 'teacher' as const, tv: teacher.tokenVersion || 0, schoolId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { accessToken, refreshToken };
  }

  async getDashboardStats(schoolId: string, teacherId: string) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['classroom', 'classroom.students'],
    });

    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }

    let totalStudents = 0;
    const today = new Date().toISOString().split('T')[0];
    let todayAbsent = 0;

    if (teacher.classroom) {
      totalStudents = teacher.classroom.students.length;
      todayAbsent = await this.attendanceRepo.count({
        where: {
          school: { id: schoolId },
          date: today,
          isAbsent: true,
          student: { classroom: { id: teacher.classroomId } },
        },
      });
    } else {
      const course = await this.courseRepo.findOne({
        where: { teacherId },
        relations: ['enrolledStudents'],
      });
      if (course) {
        totalStudents = (course.enrolledStudents || []).filter((s) => s.isActive !== false).length;
        const absentRows = await this.courseAttendanceRepo.find({
          where: {
            schoolId,
            date: today,
            isAbsent: true,
            courseId: course.id,
          },
        });
        todayAbsent = absentRows.length;
      }
    }

    return {
      assignedClassroom: teacher.classroom || null,
      totalStudents,
      todayAbsent,
      todayPresent: totalStudents - todayAbsent,
    };
  }

  async getAssignedClassroom(schoolId: string, teacherId: string) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['classroom', 'classroom.students'],
    });

    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }

    if (!teacher.classroom) {
      throw ApiError.notFound('لم يتم تعيين قسم');
    }

    return teacher.classroom;
  }

  async recordAttendance(schoolId: string, teacherId: string, data: any) {
    const period = data.period || 'morning';

    const existing = await this.attendanceRepo.findOne({
      where: {
        school: { id: schoolId },
        student: { id: data.studentId },
        date: data.date,
        period,
      },
    });

    let saved: Attendance;
    if (existing) {
      if (data.isAbsent && !existing.isAbsent) {
        existing.isAbsent = true;
        existing.recordedById = teacherId;
        saved = await this.attendanceRepo.save(existing);
      } else {
        saved = existing;
      }
    } else {
      saved = await this.attendanceRepo.save({
        ...data,
        period,
        schoolId,
        recordedById: teacherId,
      } as Attendance);
    }
    const activitySync = await this.activityService.syncForStudent(schoolId, saved.studentId!, saved.date, saved.period, saved.isAbsent);
    return { ...saved, activitySync };
  }

  async bulkRecordAttendance(schoolId: string, teacherId: string, data: any) {
    const results = [];

    for (const record of data.records) {
      const period = record.period || 'morning';
      const existing = await this.attendanceRepo.findOne({
        where: {
          school: { id: schoolId },
          student: { id: record.studentId },
          date: data.date,
          period,
        },
      });

      let saved: Attendance;
      if (existing) {
        if (record.isAbsent && !existing.isAbsent) {
          existing.isAbsent = true;
          existing.justified = record.justified || false;
          existing.justification = record.justification;
          existing.period = period;
          existing.recordedById = teacherId;
          saved = await this.attendanceRepo.save(existing);
        } else {
          saved = existing;
        }
      } else {
        saved = await this.attendanceRepo.save({
          date: data.date,
          period,
          studentId: record.studentId,
          isAbsent: record.isAbsent,
          justified: record.justified || false,
          justification: record.justification,
          schoolId,
          recordedById: teacherId,
        } as Attendance);
      }
      const activitySync = await this.activityService.syncForStudent(schoolId, saved.studentId!, saved.date, saved.period, saved.isAbsent);
      results.push({ ...saved, activitySync });
    }

    return results;
  }

  async updateQuranProgress(schoolId: string, data: any) {
    const existing = await this.quranProgressRepo.findOne({
      where: {
        school: { id: schoolId },
        student: { id: data.studentId },
        surah: { id: data.surahId },
      },
    });

    if (existing) {
      existing.status = data.status;
      existing.completionType = data.completionType;
      existing.lastAyah = data.lastAyah;
      existing.memorizationType = data.memorizationType;
      existing.grade = data.grade;
      return this.quranProgressRepo.save(existing);
    }

    const progress = this.quranProgressRepo.create({
      studentId: data.studentId,
      surahId: data.surahId,
      status: data.status,
      completionType: data.completionType,
      lastAyah: data.lastAyah,
      memorizationType: data.memorizationType,
      grade: data.grade,
      schoolId,
    });
    return this.quranProgressRepo.save(progress);
  }

  async updateLessonProgress(schoolId: string, data: any) {
    const existing = await this.lessonProgressRepo.findOne({
      where: {
        student: { id: data.studentId },
        lesson: { id: data.lessonId },
      },
    });

    if (existing) {
      existing.status = data.status;
      existing.completedAt = data.status === 'completed' ? new Date().toISOString().split('T')[0] : null;
      return this.lessonProgressRepo.save(existing);
    }

    const progress = this.lessonProgressRepo.create({
      studentId: data.studentId,
      lessonId: data.lessonId,
      status: data.status,
      completedAt: data.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
    });
    return this.lessonProgressRepo.save(progress);
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

  async getStudents(schoolId: string, teacherId: string) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['classroom'],
    });

    if (!teacher) return [];

    if (teacher.classroom) {
      return this.studentRepo.find({
        where: { classroom: { id: teacher.classroomId }, school: { id: schoolId } },
        select: ['id', 'firstName', 'lastName', 'registrationNumber', 'healthStatus', 'quranHizbs', 'quranCurrentSurahNumber'],
      });
    }

    const courses = await this.courseRepo.find({
      where: { teacherId, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    const byId = new Map<string, Student>();
    for (const course of courses) {
      for (const student of course.enrolledStudents || []) {
        if (student.isActive !== false) byId.set(student.id, student);
      }
    }
    return [...byId.values()];
  }

  async getStudentById(schoolId: string, teacherId: string, studentId: string) {
    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['classroom'],
    });

    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }

    if (teacher.classroom) {
      const student = await this.studentRepo.findOne({
        where: { id: studentId, classroom: { id: teacher.classroomId }, school: { id: schoolId } },
      });
      if (!student) {
        throw ApiError.notFound('التلميذ غير موجود');
      }
      return student;
    }

    const courses = await this.courseRepo.find({
      where: { teacherId, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    if (courses.length === 0) {
      throw ApiError.forbidden('المعلم غير معيّن على دورة');
    }
    const enrolled = courses.some((course) =>
      (course.enrolledStudents || []).some((s) => s.id === studentId),
    );
    if (!enrolled) {
      throw ApiError.notFound('التلميذ غير موجود في هذه الدورة');
    }
    const student = await this.studentRepo.findOne({ where: { id: studentId, school: { id: schoolId } } });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }
    return student;
  }
}

export const teacherService = new TeacherService();
