import { AppDataSource } from '../../config/data-source';
import { Lesson } from './lesson.entity';
import { StudentLessonProgress } from './studentLessonProgress.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Course } from '../course/course.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { AuthUser } from '../../shared/interfaces';

export class LessonService {
  constructor(
    private readonly lessonRepo = AppDataSource.getRepository(Lesson),
    private readonly progressRepo = AppDataSource.getRepository(StudentLessonProgress),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly sessionRepo = AppDataSource.getRepository(CourseSession),
  ) {}

  private async assertTeacherOwnsCourse(teacherId: string, courseId: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, teacherId } });
    if (!course) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
  }

  private async assertTeacherOwnsLesson(teacherId: string, lessonId: string): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['course'],
    });
    if (!lesson) {
      throw ApiError.notFound('الدرس غير موجود');
    }
    if (lesson.course?.teacherId !== teacherId) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
    return lesson;
  }

  async getAll(schoolId: string, courseId?: string) {
    const qb = this.lessonRepo.createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.programModule', 'programModule')
      .where('lesson.schoolId = :schoolId', { schoolId });

    if (courseId) {
      qb.andWhere('lesson.courseId = :courseId', { courseId });
    }

    return qb.orderBy('lesson.orderIndex', 'ASC').getMany();
  }

  async getById(id: string, schoolId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['programModule', 'programModule.program', 'course'],
    });
    if (!lesson) {
      throw ApiError.notFound('الدرس غير موجود');
    }
    return lesson;
  }

  async create(schoolId: string, data: any, user?: AuthUser) {
    if (user?.role === 'teacher' && data.courseId) {
      await this.assertTeacherOwnsCourse(user.id, data.courseId);
    }
    const lesson = this.lessonRepo.create({ ...data, schoolId });
    return this.lessonRepo.save(lesson);
  }

  async update(id: string, schoolId: string, data: any, user?: AuthUser) {
    const lesson = await this.lessonRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!lesson) {
      throw ApiError.notFound('الدرس غير موجود');
    }
    if (user?.role === 'teacher') {
      await this.assertTeacherOwnsLesson(user.id, id);
    }
    Object.assign(lesson, data);
    return this.lessonRepo.save(lesson);
  }

  async delete(id: string, schoolId: string, user?: AuthUser) {
    const lesson = await this.lessonRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!lesson) {
      throw ApiError.notFound('الدرس غير موجود');
    }
    if (user?.role === 'teacher') {
      await this.assertTeacherOwnsLesson(user.id, id);
    }

    const completedSession = await this.sessionRepo
      .createQueryBuilder('session')
      .innerJoin('session.lessons', 'lesson', 'lesson.id = :lessonId', { lessonId: id })
      .where('session.completedAt IS NOT NULL')
      .getOne();
    if (completedSession) {
      throw ApiError.badRequest('لا يمكن حذف درس مُعطى في حصة مكتملة');
    }

    await this.lessonRepo.remove(lesson);
  }

  async getStudentLessonProgress(studentId: string, schoolId: string) {
    const progress = await this.progressRepo.find({
      where: { student: { id: studentId }, lesson: { school: { id: schoolId } } },
      relations: ['lesson', 'lesson.programModule'],
      order: { createdAt: 'DESC' },
    });

    const completed = progress.filter(p => p.status === 'completed').length;
    const total = progress.length;

    return {
      progress,
      stats: {
        completed,
        total,
        rate: total > 0 ? (completed / total * 100).toFixed(1) : '0',
      },
    };
  }

  async updateStudentProgress(data: any) {
    const existing = await this.progressRepo.findOne({
      where: {
        student: { id: data.studentId },
        lesson: { id: data.lessonId },
      },
    });

    if (existing) {
      existing.status = data.status;
      existing.completedAt = data.status === 'completed' ? new Date().toISOString().split('T')[0] : null;
      return this.progressRepo.save(existing);
    }

    const progress = this.progressRepo.create({
      studentId: data.studentId,
      lessonId: data.lessonId,
      status: data.status,
      completedAt: data.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
    });
    return this.progressRepo.save(progress);
  }
}

export const lessonService = new LessonService();