import { AppDataSource } from '../../config/data-source';
import { Program } from './program.entity';
import { ProgramModule } from './programModule.entity';
import { Lesson } from '../lesson/lesson.entity';
import { CourseSession } from '../courseSession/courseSession.entity';
import { Course } from '../course/course.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { AuthUser } from '../../shared/interfaces';

export class ProgramService {
  constructor(
    private readonly programRepo = AppDataSource.getRepository(Program),
    private readonly moduleRepo = AppDataSource.getRepository(ProgramModule),
    private readonly lessonRepo = AppDataSource.getRepository(Lesson),
    private readonly sessionRepo = AppDataSource.getRepository(CourseSession),
    private readonly courseRepo = AppDataSource.getRepository(Course),
  ) {}

  private async assertTeacherOwnsCourse(teacherId: string, courseId: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, teacherId } });
    if (!course) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
  }

  private async assertTeacherOwnsProgram(teacherId: string, programId: string): Promise<Program> {
    const program = await this.programRepo.findOne({
      where: { id: programId },
      relations: ['course'],
    });
    if (!program) {
      throw ApiError.notFound('البرنامج غير موجود');
    }
    if (program.course?.teacherId !== teacherId) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
    return program;
  }

  private async assertTeacherOwnsModule(teacherId: string, moduleId: string): Promise<ProgramModule> {
    const mod = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: ['program', 'program.course'],
    });
    if (!mod) {
      throw ApiError.notFound('الوحدة غير موجودة');
    }
    if (mod.program?.course?.teacherId !== teacherId) {
      throw ApiError.forbidden('هذه الدورة ليست من دوراتك');
    }
    return mod;
  }

  private async hasCompletedLesson(lessonIds: string[]): Promise<boolean> {
    if (!lessonIds.length) return false;
    const count = await this.sessionRepo
      .createQueryBuilder('session')
      .innerJoin('session.lessons', 'lesson', 'lesson.id IN (:...ids)', { ids: lessonIds })
      .where('session.completedAt IS NOT NULL')
      .getCount();
    return count > 0;
  }

  async getAll(schoolId: string) {
    return this.programRepo.find({
      where: { course: { school: { id: schoolId } } },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['course', 'modules', 'modules.lessons'],
    });
    if (!program) {
      throw ApiError.notFound('البرنامج غير موجود');
    }
    return program;
  }

  async create(schoolId: string, data: any, user: AuthUser) {
    if (user.role === 'teacher') {
      await this.assertTeacherOwnsCourse(user.id, data.courseId);
    }
    const program = this.programRepo.create({ ...data, schoolId });
    return this.programRepo.save(program);
  }

  async update(id: string, schoolId: string, data: any, user: AuthUser) {
    let program = await this.programRepo.findOne({ where: { id } });
    if (!program) {
      throw ApiError.notFound('البرنامج غير موجود');
    }
    if (user.role === 'teacher') {
      program = await this.assertTeacherOwnsProgram(user.id, id);
    }
    Object.assign(program, data);
    return this.programRepo.save(program);
  }

  async delete(id: string, schoolId: string, user: AuthUser) {
    let program = await this.programRepo.findOne({ where: { id } });
    if (!program) {
      throw ApiError.notFound('البرنامج غير موجود');
    }
    if (user.role === 'teacher') {
      program = await this.assertTeacherOwnsProgram(user.id, id);
    }

    const full = await this.programRepo.findOne({
      where: { id },
      relations: ['modules', 'modules.lessons'],
    });
    const allLessonIds = (full?.modules || []).flatMap((m) => (m.lessons || []).map((l) => l.id));
    if (await this.hasCompletedLesson(allLessonIds)) {
      throw ApiError.badRequest('لا يمكن حذف برنامج يحتوي على دروس مُعطاة في حصص مكتملة');
    }

    await this.programRepo.remove(program);
  }

  async createModule(data: any, schoolId: string, user: AuthUser) {
    if (user.role === 'teacher') {
      await this.assertTeacherOwnsCourse(user.id, data.courseId);
    }
    const programModule = this.moduleRepo.create(data);
    return this.moduleRepo.save(programModule);
  }

  async updateModule(id: string, schoolId: string, data: any, user: AuthUser) {
    let mod = await this.moduleRepo.findOne({ where: { id } });
    if (!mod) {
      throw ApiError.notFound('الوحدة غير موجودة');
    }
    if (user.role === 'teacher') {
      mod = await this.assertTeacherOwnsModule(user.id, id);
    }
    Object.assign(mod, data);
    return this.moduleRepo.save(mod);
  }

  async deleteModule(id: string, schoolId: string, user: AuthUser) {
    let mod = await this.moduleRepo.findOne({ where: { id } });
    if (!mod) {
      throw ApiError.notFound('الوحدة غير موجودة');
    }
    if (user.role === 'teacher') {
      mod = await this.assertTeacherOwnsModule(user.id, id);
    }

    const full = await this.moduleRepo.findOne({
      where: { id },
      relations: ['lessons'],
    });
    const lessonIds = (full?.lessons || []).map((l) => l.id);
    if (await this.hasCompletedLesson(lessonIds)) {
      throw ApiError.badRequest('لا يمكن حذف وحدة تحتوي على دروس مُعطاة في حصص مكتملة');
    }

    await this.moduleRepo.remove(mod);
  }

  async getByCourse(courseId: string) {
    return this.programRepo.findOne({
      where: { courseId },
      relations: ['course', 'modules', 'modules.lessons'],
    });
  }
}

export const programService = new ProgramService();
