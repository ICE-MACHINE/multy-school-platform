import { AppDataSource } from '../../config/data-source';
import { In } from 'typeorm';
import { Course } from './course.entity';
import { Student } from '../student/student.entity';
import { School } from '../school/school.entity';
import { Payment } from '../payment/payment.entity';
import { courseSessionService } from '../courseSession/courseSession.service';
import { ApiError } from '../../shared/utils/ApiError';
import { validateCoursePricing, assertStartDateEditable } from './coursePricing.util';
import { assertTeacherNotOnAnotherCourse } from './courseTeacher.util';
import { computeUnenrollRefund } from './courseRefund.util';

export class CourseService {
  constructor(
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
  ) {}

  async getAll(schoolId: string, page = 1, limit = 20, search?: string) {
    const qb = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .where('course.schoolId = :schoolId', { schoolId });

    if (search) {
      qb.andWhere('course.name LIKE :search', { search: `%${search}%` });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('course.name', 'ASC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string, schoolId: string) {
    const course = await this.courseRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['teacher', 'enrolledStudents'],
    });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }
    return course;
  }

  async create(schoolId: string, data: any) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    validateCoursePricing(school?.type, data);
    await assertTeacherNotOnAnotherCourse(this.courseRepo, schoolId, data.teacherId);
    const course = this.courseRepo.create({ ...data, schoolId });
    return this.courseRepo.save(course);
  }

  async update(id: string, schoolId: string, data: any) {
    const course = await this.courseRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    validateCoursePricing(school?.type, { ...course, ...data });
    assertStartDateEditable(course, data);
    if (data.teacherId !== undefined && data.teacherId !== course.teacherId) {
      await assertTeacherNotOnAnotherCourse(this.courseRepo, schoolId, data.teacherId, id);
    }
    Object.assign(course, data);
    return this.courseRepo.save(course);
  }

  async delete(id: string, schoolId: string) {
    const course = await this.courseRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      throw ApiError.badRequest('لا يمكن حذف مادة مسجّل فيها تلاميذ');
    }
    await this.courseRepo.remove(course);
  }

  async getEnrolledStudents(id: string, schoolId: string) {
    const course = await this.courseRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    if (!course) {
      throw ApiError.notFound('المادة غير موجودة');
    }
    return course.enrolledStudents || [];
  }

  async enrollStudent(courseId: string, schoolId: string, studentId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    if (!course) throw ApiError.notFound('المادة غير موجودة');

    const student = await this.studentRepo.findOne({ where: { id: studentId, school: { id: schoolId } } });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');

    if (!course.enrolledStudents) course.enrolledStudents = [];
    const alreadyEnrolled = course.enrolledStudents.some((s) => s.id === studentId);
    if (!alreadyEnrolled) {
      course.enrolledStudents.push(student);
      await this.courseRepo.save(course);
    }
    return course;
  }

  async unenrollStudent(courseId: string, schoolId: string, studentId: string, refund?: boolean) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    if (!course) throw ApiError.notFound('المادة غير موجودة');

    if (!course.enrolledStudents) course.enrolledStudents = [];
    const wasEnrolled = course.enrolledStudents.some((s) => s.id === studentId);
    if (!wasEnrolled) throw ApiError.badRequest('التلميذ غير مسجّل في هذه الدورة');

    const preview = await this.getUnenrollPreview(courseId, schoolId, studentId);
    const wantsRefund = refund === true;

    if (preview.mode === 'required' && !wantsRefund) {
      throw ApiError.badRequest('يجب استرداد المبلغ قبل إخراج التلميذ من الدورة');
    }
    if (preview.mode === 'none' && wantsRefund) {
      throw ApiError.badRequest('لا يوجد مبلغ قابل للاسترداد لهذا التلميذ');
    }

    let refundedAmount = 0;
    if (wantsRefund && preview.items.length > 0) {
      const ids = preview.items.map((i) => i.paymentId).filter(Boolean) as string[];
      if (ids.length > 0) {
        const payments = await this.paymentRepo.findBy({ id: In(ids) });
        const today = new Date().toISOString().split('T')[0];
        for (const p of payments) {
          p.refunded = true;
          p.refundedAt = today;
          refundedAmount += Number(p.amount);
        }
        await this.paymentRepo.save(payments);
      }
    }

    course.enrolledStudents = course.enrolledStudents.filter((s) => s.id !== studentId);
    await this.courseRepo.save(course);

    return { course, refunded: wantsRefund, refundedAmount, preview };
  }

  /**
   * For private schools: computes the refund obligations before removing a
   * student from a course (see computeUnenrollRefund for the rules).
   */
  async getUnenrollPreview(courseId: string, schoolId: string, studentId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, school: { id: schoolId } },
      relations: ['enrolledStudents'],
    });
    if (!course) throw ApiError.notFound('المادة غير موجودة');

    const enrolled = (course.enrolledStudents || []).some((s) => s.id === studentId);
    if (!enrolled) throw ApiError.badRequest('التلميذ غير مسجّل في هذه الدورة');

    const payments = await this.paymentRepo.find({
      where: { student: { id: studentId }, course: { id: courseId }, school: { id: schoolId } },
    });
    const completedSessionNumbers = await courseSessionService.getCompletedSessionNumbers(courseId);
    return computeUnenrollRefund(course, payments, completedSessionNumbers);
  }
}

export const courseService = new CourseService();
