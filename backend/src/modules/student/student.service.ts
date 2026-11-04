import { AppDataSource } from '../../config/data-source';
import { DeepPartial, IsNull } from 'typeorm';
import { Student } from './student.entity';
import { StudentExemptionPeriod } from './studentExemptionPeriod.entity';
import { Classroom } from '../classroom/classroom.entity';
import { Parent } from '../parent/parent.entity';
import { QuranProgress } from '../quranProgress/quranProgress.entity';
import { Surah } from '../quranProgress/surah.entity';
import { Course } from '../course/course.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Lesson } from '../lesson/lesson.entity';
import { StudentLessonProgress } from '../lesson/studentLessonProgress.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { ApiError } from '../../shared/utils/ApiError';

export class StudentService {
  constructor(
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly exemptionPeriodRepo = AppDataSource.getRepository(StudentExemptionPeriod),
    private readonly classroomRepo = AppDataSource.getRepository(Classroom),
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly surahRepo = AppDataSource.getRepository(Surah),
    private readonly quranProgressRepo = AppDataSource.getRepository(QuranProgress),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly courseAttendanceRepo = AppDataSource.getRepository(CourseAttendance),
    private readonly courseSessionRepo = AppDataSource.getRepository(CourseSession),
    private readonly attendanceRepo = AppDataSource.getRepository(Attendance),
    private readonly lessonRepo = AppDataSource.getRepository(Lesson),
    private readonly lessonProgressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly schoolService: SchoolService = defaultSchoolService,
  ) {}

  async validateClassroomCapacity(schoolId: string, classroomId: string, excludeStudentId?: string) {
    if (!classroomId) return;
    const classroom = await this.classroomRepo.findOne({
      where: { id: classroomId, school: { id: schoolId } },
      relations: ['students'],
    });
    if (!classroom) {
      throw ApiError.notFound('القسم غير موجود');
    }
    const currentCount = excludeStudentId
      ? classroom.students.filter((s) => s.id !== excludeStudentId).length
      : classroom.students.length;
    if (currentCount + 1 > classroom.capacity) {
      throw ApiError.badRequest(`القسم ممتلئ - لا يمكن إضافة طالب، السعة القصوى ${classroom.capacity} طالب (العدد الحالي ${currentCount})`);
    }
  }

  async validateParent(schoolId: string, parentId: string) {
    const parent = await this.parentRepo.findOne({
      where: { id: parentId, school: { id: schoolId } },
    });
    if (!parent) {
      throw ApiError.badRequest('ولي الأمر غير موجود في هذه المدرسة');
    }
  }

  async getAll(schoolId: string, page = 1, limit = 20, search?: string, classroomId?: string) {
    const qb = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.parent', 'parent')
      .leftJoinAndSelect('student.classroom', 'classroom')
      .where('student.schoolId = :schoolId', { schoolId });

    if (search) {
      qb.andWhere('(student.firstName LIKE :search OR student.lastName LIKE :search OR student.registrationNumber LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (classroomId) {
      qb.andWhere('student.classroomId = :classroomId', { classroomId });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('student.firstName', 'ASC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['parent', 'classroom', 'enrolledCourses'],
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }
    return student;
  }

  async create(schoolId: string, data: any) {
    if (!data.parentId) {
      throw ApiError.badRequest('لا يمكن إضافة تلميذ دون ولي أمر');
    }
    await this.schoolService.assertUsersCapacity(schoolId);
    await this.validateParent(schoolId, data.parentId);
    await this.validateClassroomCapacity(schoolId, data.classroomId);

    const existingStudent = await this.studentRepo.findOne({
      where: { registrationNumber: data.registrationNumber, school: { id: schoolId } },
    });
    if (existingStudent) {
      throw ApiError.conflict('رقم التسجيل موجود مسبقاً في هذه المدرسة');
    }

    const student = this.studentRepo.create({
      ...data,
      parentId: data.parentId,
      classroomId: data.classroomId || null,
      schoolId,
    } as DeepPartial<Student>);
    const saved = await this.studentRepo.save(student);

    if (saved.isExemptFromPayment) {
      await this.exemptionPeriodRepo.save(
        this.exemptionPeriodRepo.create({ studentId: saved.id, startDate: new Date(), endDate: null }),
      );
    }

    if (saved.classroomId) {
      const surahs = await this.surahRepo.find();
      const progressEntries = surahs.map(surah =>
        this.quranProgressRepo.create({
          studentId: saved.id,
          surahId: surah.id,
          status: 'not_reached',
          schoolId,
        })
      );
      await this.quranProgressRepo.save(progressEntries);
    }

    return saved;
  }

  async update(id: string, schoolId: string, data: any) {
    const student = await this.studentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    if (data.parentId !== undefined) {
      if (!data.parentId) {
        throw ApiError.badRequest('لا يمكن إزالة ولي الأمر من التلميذ');
      }
      await this.validateParent(schoolId, data.parentId);
    }

    if (data.classroomId !== undefined && data.classroomId !== student.classroomId) {
      await this.validateClassroomCapacity(schoolId, data.classroomId || '', id);
    }

    Object.assign(student, {
      ...data,
      parentId: data.parentId !== undefined ? data.parentId : student.parentId,
      classroomId: data.classroomId !== undefined ? (data.classroomId || null) : student.classroomId,
    });
    return this.studentRepo.save(student);
  }

  async delete(id: string, schoolId: string) {
    const student = await this.studentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }
    return this.studentRepo.remove(student);
  }

  async toggleExemption(id: string, schoolId: string) {
    const student = await this.studentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    if (student.isExemptFromPayment) {
      const now = new Date();
      const currentDay = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      let endDate: Date;
      let message: string;
      if (currentDay <= daysInMonth / 2) {
        endDate = now;
        message = 'تم إزالة الإعفاء - يبدأ الدفع من هذا الشهر';
      } else {
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        message = 'لم يبقَ من الشهر أكثر من النصف - الإعفاء ساري لهذا الشهر، يبدأ الدفع من الشهر القادم';
      }

      await this.exemptionPeriodRepo.update({ studentId: id, endDate: IsNull() }, { endDate });
      student.isExemptFromPayment = false;
      const saved = await this.studentRepo.save(student);
      return { student: saved, message };
    }

    student.isExemptFromPayment = true;
    const saved = await this.studentRepo.save(student);
    await this.exemptionPeriodRepo.save(
      this.exemptionPeriodRepo.create({ studentId: id, startDate: new Date(), endDate: null }),
    );
    return { student: saved, message: 'تم تطبيق الإعفاء ابتداءً من اليوم' };
  }

  async enrollInCourse(studentId: string, courseId: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['enrolledCourses'],
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }

    if (!student.enrolledCourses) {
      student.enrolledCourses = [];
    }

    const alreadyEnrolled = student.enrolledCourses.some(c => c.id === courseId);
    if (alreadyEnrolled) {
      throw ApiError.conflict('التلميذ مسجّل في هذه المادة مسبقاً');
    }

    student.enrolledCourses.push(course);
    return this.studentRepo.save(student);
  }

  async unenrollFromCourse(studentId: string, courseId: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['enrolledCourses'],
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    if (!student.enrolledCourses) {
      throw ApiError.notFound('التلميذ غير مسجّل في أي مادة');
    }

    student.enrolledCourses = student.enrolledCourses.filter(c => c.id !== courseId);
    return this.studentRepo.save(student);
  }

  async getStudentStats(studentId: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['classroom'],
    });

    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const totalAttendance = await this.attendanceRepo.count({
      where: { student: { id: studentId }, school: { id: schoolId } },
    });
    const absences = await this.attendanceRepo.count({
      where: { student: { id: studentId }, school: { id: schoolId }, isAbsent: true },
    });

    const memorized = await this.quranProgressRepo.count({
      where: { student: { id: studentId }, school: { id: schoolId }, status: 'memorized' },
    });
    const memorizing = await this.quranProgressRepo.count({
      where: { student: { id: studentId }, school: { id: schoolId }, status: 'memorizing' },
    });

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        registrationNumber: student.registrationNumber,
      },
      attendance: {
        total: totalAttendance,
        absences,
        presence: totalAttendance - absences,
        rate: totalAttendance > 0 ? ((totalAttendance - absences) / totalAttendance * 100).toFixed(1) : '0',
      },
      quranProgress: {
        memorized,
        memorizing,
      },
    };
  }

  async getCourseProgress(studentId: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const enrolledCourses = await this.courseRepo
      .createQueryBuilder('course')
      .innerJoin('course.enrolledStudents', 'student', 'student.id = :studentId', { studentId })
      .where('course.schoolId = :schoolId', { schoolId })
      .getMany();

    if (enrolledCourses.length === 0) return [];

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
    const lessonSessionMap = new Map<string, string | null>(); // lessonId -> session completedAt
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

    return enrolledCourses.map(course => {
      const lessons = lessonsByCourse.get(course.id) || [];
      const enrollmentDate = earliestAttendanceByCourse.get(course.id) || null;
      const moduleMap = new Map<string, { id: string; title: string; orderIndex: number; lessons: any[] }>();
      const ungroupedLessons: any[] = [];

      for (const lesson of lessons) {
        const progress = progressMap.get(lesson.id);
        const sessionCompletedAt = lessonSessionMap.get(lesson.id);

        // If lesson was taught before student's first attendance → not enrolled yet
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

export const studentService = new StudentService();
