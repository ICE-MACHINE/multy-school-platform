import { AppDataSource } from '../../config/data-source';
import { Teacher } from '../teacher/teacher.entity';
import { Course } from '../course/course.entity';
import { Activity } from '../activity/activity.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { ApiError } from '../../shared/utils/ApiError';
import { bumpTokenVersion } from '../../shared/auth/sessionRevocation';
import { hashPassword } from '../../shared/utils/hash';
import { assertPhoneUniqueAcrossRoles } from '../../shared/utils/phoneUniqueness';

export class SchoolAdminTeachersService {
  constructor(
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly activityRepo = AppDataSource.getRepository(Activity),
    private readonly schoolService: SchoolService = defaultSchoolService,
  ) {}

  async getAllTeachers(schoolId: string, page = 1, limit = 20, search?: string) {
    const qb = this.teacherRepo.createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.classroom', 'classroom')
      .where('teacher.schoolId = :schoolId', { schoolId });

    if (search) {
      qb.andWhere('(teacher.firstName LIKE :search OR teacher.lastName LIKE :search OR teacher.phone LIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb
      .select(['teacher.id', 'teacher.firstName', 'teacher.lastName', 'teacher.phone', 'teacher.gender', 'teacher.isActive', 'teacher.classroomId', 'classroom.id', 'classroom.name'])
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('teacher.firstName', 'ASC')
      .getMany();

    const courses = await this.courseRepo.find({
      where: { schoolId },
      select: ['id', 'name', 'teacherId'],
    });
    const courseByTeacher = new Map(courses.filter((c) => c.teacherId).map((c) => [c.teacherId, c]));

    return {
      data: data.map((teacher) => {
        const course = courseByTeacher.get(teacher.id) || null;
        return { ...teacher, courseId: course?.id || null, course };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTeacherById(id: string, schoolId: string) {
    const teacher = await this.teacherRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['classroom'],
      select: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'classroomId', 'isActive', 'createdAt'],
    });
    if (!teacher) throw ApiError.notFound('المعلم غير موجود');

    const course = await this.courseRepo.findOne({
      where: { schoolId, teacherId: id },
      select: ['id', 'name'],
    });

    const activities = await this.activityRepo.find({
      where: { teacher: { id }, school: { id: schoolId } },
      relations: ['classroom'],
      order: { date: 'DESC', period: 'ASC', createdAt: 'DESC' },
    });

    return { ...teacher, courseId: course?.id || null, course: course || null, activities };
  }

  async createTeacher(schoolId: string, data: any) {
    if (!schoolId) {
      throw ApiError.badRequest('معرف المدرسة مطلوب');
    }
    await this.schoolService.assertUsersCapacity(schoolId);
    await assertPhoneUniqueAcrossRoles(schoolId, data.phone);

    const hashedPassword = await hashPassword(data.password);
    const teacher = this.teacherRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      classroomId: data.classroomId,
      schoolId,
      password: hashedPassword,
    });
    const saved = await this.teacherRepo.save(teacher);

    if (data.courseId) {
      const course = await this.courseRepo.findOne({ where: { id: data.courseId, schoolId } });
      if (!course) throw ApiError.notFound('الدورة غير موجودة');
      if (course.teacherId && course.teacherId !== saved.id) {
        throw ApiError.badRequest('هذه الدورة مكلفة حالياً بأستاذ آخر');
      }
      course.teacherId = saved.id;
      await this.courseRepo.save(course);
    }
    return saved;
  }

  async updateTeacher(id: string, schoolId: string, data: any) {
    const teacher = await this.teacherRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }

    if (data.phone && data.phone !== teacher.phone) {
      await assertPhoneUniqueAcrossRoles(schoolId, data.phone, { role: 'teacher', id });
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    if (data.classroomId) {
      const currentHolder = await this.teacherRepo.findOne({ where: { classroomId: data.classroomId } });
      if (currentHolder && currentHolder.id !== id) {
        currentHolder.classroomId = null as any;
        await this.teacherRepo.save(currentHolder);
      }
    }

    if (data.courseId !== undefined) {
      await this.assignCourse(id, schoolId, data.courseId);
    }
    delete data.courseId;

    Object.assign(teacher, data);
    const savedTeacher = await this.teacherRepo.save(teacher);
    await bumpTokenVersion('teacher', id);
    return savedTeacher;
  }

  private async assignCourse(teacherId: string, schoolId: string, courseId: string | null) {
    const current = await this.courseRepo.findOne({ where: { schoolId, teacherId } });

    if (!courseId) {
      if (current) {
        current.teacherId = null as any;
        await this.courseRepo.save(current);
      }
      return;
    }

    if (current && current.id !== courseId) {
      throw ApiError.badRequest('لا يمكن تكليف هذا الأستاذ — هو يدرّس حالياً دورة أخرى (دورة واحدة لكل أستاذ)');
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId, schoolId } });
    if (!course) throw ApiError.notFound('الدورة غير موجودة');
    if (course.teacherId && course.teacherId !== teacherId) {
      throw ApiError.badRequest('هذه الدورة مكلفة حالياً بأستاذ آخر');
    }

    course.teacherId = teacherId;
    await this.courseRepo.save(course);
  }

  async deleteTeacher(id: string, schoolId: string) {
    const teacher = await this.teacherRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!teacher) {
      throw ApiError.notFound('المعلم غير موجود');
    }
    teacher.isActive = false;
    const savedTeacher = await this.teacherRepo.save(teacher);
    await bumpTokenVersion('teacher', id);
    return savedTeacher;
  }
}

export const schoolAdminTeachersService = new SchoolAdminTeachersService();
