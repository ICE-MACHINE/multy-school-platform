import { AppDataSource } from '../../config/data-source';
import { In, IsNull } from 'typeorm';
import { Student } from '../student/student.entity';
import { StudentExemptionPeriod } from '../student/studentExemptionPeriod.entity';
import { Parent } from '../parent/parent.entity';
import { Payment } from '../payment/payment.entity';
import { School } from '../school/school.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { StudentService, studentService as defaultStudentService } from '../student/student.service';
import { PaymentService, paymentService as defaultPaymentService } from '../payment/payment.service';
import { computePaymentStatusMap, computePrivatePaymentStatusMap, type ExemptionPeriodLike, type PaymentStatus } from '../payment/paymentStatus.util';
import { courseSessionService } from '../courseSession/courseSession.service';
import { courseService } from '../course/course.service';
import { ApiError } from '../../shared/utils/ApiError';

export class SchoolAdminStudentsService {
  constructor(
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly exemptionPeriodRepo = AppDataSource.getRepository(StudentExemptionPeriod),
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly schoolService: SchoolService = defaultSchoolService,
    private readonly studentService: StudentService = defaultStudentService,
    private readonly paymentService: PaymentService = defaultPaymentService,
  ) {}

  private async loadCompletedSessions(students: any[]): Promise<Map<string, Set<number>>> {
    const courseIds = new Set<string>();
    for (const s of students) {
      for (const c of s.enrolledCourses || []) {
        courseIds.add(c.id);
      }
    }
    return courseSessionService.getCompletedSessionNumbersByCourses(Array.from(courseIds));
  }

  async getAllStudents(schoolId: string, page = 1, limit = 20, search?: string, gender?: string, classroomId?: string, courseId?: string, paymentStatus?: string) {
    const buildBaseQuery = () => {
      const qb = this.studentRepo.createQueryBuilder('student')
        .where('student.schoolId = :schoolId', { schoolId })
        .andWhere('student.isActive = :isActive', { isActive: true });

      if (search) {
        qb.andWhere('(student.firstName LIKE :search OR student.lastName LIKE :search OR student.registrationNumber LIKE :search)', {
          search: `%${search}%`,
        });
      }

      if (gender && gender !== 'all') {
        qb.andWhere('student.gender = :gender', { gender });
      }

      if (classroomId && classroomId !== 'all') {
        if (classroomId === 'none') {
          qb.andWhere('student.classroomId IS NULL');
        } else {
          qb.andWhere('student.classroomId = :classroomId', { classroomId });
        }
      }

      if (courseId && courseId !== 'all') {
        qb.leftJoin('student.enrolledCourses', 'enrolledCourse');
        if (courseId === 'none') {
          qb.andWhere('enrolledCourse.id IS NULL');
        } else {
          qb.andWhere('enrolledCourse.id = :courseId', { courseId });
        }
      }

      return qb;
    };

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    const isPrivate = school?.type === 'private';

    const allStudents = await buildBaseQuery()
      .select(['student.id', 'student.firstName', 'student.isExemptFromPayment', 'student.createdAt'])
      .leftJoinAndSelect('student.enrolledCourses', 'privateCourse')
      .orderBy('student.firstName', 'ASC')
      .getMany();

    const ids = allStudents.map((s) => s.id);

    let statusMap: Map<string, PaymentStatus>;
    if (isPrivate) {
      const paymentsMap = new Map<string, any[]>();
      if (ids.length > 0) {
        const payments = await this.paymentRepo
          .createQueryBuilder('payment')
          .where('payment.studentId IN (:...ids)', { ids })
          .andWhere('payment.courseId IS NOT NULL')
          .getMany();
        for (const p of payments) {
          if (!p.studentId) continue;
          if (!paymentsMap.has(p.studentId)) paymentsMap.set(p.studentId, []);
          paymentsMap.get(p.studentId)!.push(p);
        }
      }
      statusMap = new Map(computePrivatePaymentStatusMap(allStudents, paymentsMap, new Date(), await this.loadCompletedSessions(allStudents)));
    } else {
      const paidMap = new Map<string, Set<string>>();
      if (ids.length > 0) {
        const payments = await this.paymentRepo
          .createQueryBuilder('payment')
          .where('payment.studentId IN (:...ids)', { ids })
          .andWhere('payment.month IS NOT NULL')
          .getMany();
        for (const p of payments) {
          if (!p.studentId) continue;
          if (!paidMap.has(p.studentId)) paidMap.set(p.studentId, new Set());
          paidMap.get(p.studentId)!.add(p.month);
        }
      }

      const exemptionMap = new Map<string, ExemptionPeriodLike[]>();
      if (ids.length > 0) {
        const periods = await this.exemptionPeriodRepo.find({ where: { studentId: In(ids) } });
        for (const p of periods) {
          if (!exemptionMap.has(p.studentId)) exemptionMap.set(p.studentId, []);
          exemptionMap.get(p.studentId)!.push({ startDate: p.startDate, endDate: p.endDate });
        }
      }

      statusMap = computePaymentStatusMap(allStudents, paidMap, new Date(), exemptionMap);
    }

    let filtered = allStudents;
    if (paymentStatus && paymentStatus !== 'all') {
      filtered = allStudents.filter((s) => statusMap.get(s.id) === paymentStatus);
    }

    const total = filtered.length;
    const pageIds = filtered.slice((page - 1) * limit, page * limit).map((s) => s.id);

    let data: any[] = [];
    if (pageIds.length > 0) {
      data = await this.studentRepo.createQueryBuilder('student')
        .leftJoinAndSelect('student.parent', 'parent')
        .leftJoinAndSelect('student.classroom', 'classroom')
        .leftJoinAndSelect('student.enrolledCourses', 'enrolledCourses')
        .where('student.id IN (:...ids)', { ids: pageIds })
        .orderBy('student.firstName', 'ASC')
        .getMany();
      for (const s of data) {
        s.paymentStatus = statusMap.get(s.id) || 'paid';
      }
    }

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStudentById(id: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['parent', 'classroom', 'exemptionPeriods', 'enrolledCourses'],
    });
    if (!student) throw ApiError.notFound('التلميذ غير موجود');
    return student;
  }

  async createStudent(schoolId: string, data: any) {
    if (!schoolId) {
      throw ApiError.badRequest('معرف المدرسة مطلوب');
    }
    await this.schoolService.assertUsersCapacity(schoolId);
    if (!data.firstName || !data.firstName.trim()) {
      throw ApiError.badRequest('الاسم الأول مطلوب');
    }
    if (!data.lastName || !data.lastName.trim()) {
      throw ApiError.badRequest('الاسم الأخير مطلوب');
    }
    if (!data.parentId) {
      throw ApiError.badRequest('لا يمكن إضافة تلميذ دون ولي أمر');
    }
    const parent = await this.parentRepo.findOne({
      where: { id: data.parentId, school: { id: schoolId } },
    });
    if (!parent) {
      throw ApiError.badRequest('ولي الأمر غير موجود في هذه المدرسة');
    }
    await this.studentService.validateClassroomCapacity(schoolId, data.classroomId);
    const existingStudent = await this.studentRepo.findOne({
      where: { registrationNumber: data.registrationNumber, school: { id: schoolId } },
    });
    if (existingStudent) {
      throw ApiError.conflict('رقم التسجيل موجود مسبقاً في هذه المدرسة');
    }

    const student = this.studentRepo.create({
      registrationNumber: data.registrationNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      healthStatus: data.healthStatus,
      parentId: data.parentId || null,
      classroomId: data.classroomId || null,
      isExemptFromPayment: data.isExemptFromPayment,
      schoolId,
    });
    const saved = await this.studentRepo.save(student);
    if (saved.isExemptFromPayment) {
      await this.exemptionPeriodRepo.save(
        this.exemptionPeriodRepo.create({ studentId: saved.id, startDate: new Date(), endDate: null }),
      );
    }
    return saved;
  }

  async updateStudent(id: string, schoolId: string, data: any) {
    if (data.firstName !== undefined && (!data.firstName || !data.firstName.trim())) {
      throw ApiError.badRequest('الاسم الأول مطلوب');
    }
    if (data.lastName !== undefined && (!data.lastName || !data.lastName.trim())) {
      throw ApiError.badRequest('الاسم الأخير مطلوب');
    }
    const student = await this.studentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }
    if (data.parentId !== undefined) {
      if (!data.parentId) {
        throw ApiError.badRequest('لا يمكن إزالة ولي الأمر من التلميذ');
      }
      const parent = await this.parentRepo.findOne({
        where: { id: data.parentId, school: { id: schoolId } },
      });
      if (!parent) {
        throw ApiError.badRequest('ولي الأمر غير موجود في هذه المدرسة');
      }
    }
    if (data.classroomId !== undefined && data.classroomId !== student.classroomId) {
      await this.studentService.validateClassroomCapacity(schoolId, data.classroomId || '', id);
    }
    const exemptionChanged = data.isExemptFromPayment !== undefined && data.isExemptFromPayment !== student.isExemptFromPayment;
    Object.assign(student, {
      ...data,
      parentId: data.parentId !== undefined ? data.parentId : student.parentId,
      classroomId: data.classroomId !== undefined ? (data.classroomId || null) : student.classroomId,
    });
    const saved = await this.studentRepo.save(student);
    if (exemptionChanged) {
      if (saved.isExemptFromPayment) {
        await this.exemptionPeriodRepo.save(
          this.exemptionPeriodRepo.create({ studentId: id, startDate: new Date(), endDate: null }),
        );
      } else {
        await this.exemptionPeriodRepo.update({ studentId: id, endDate: IsNull() }, { endDate: new Date() });
      }
    }
    return saved;
  }

  async deleteStudent(id: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['enrolledCourses'],
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    for (const course of student.enrolledCourses || []) {
      try {
        await courseService.unenrollStudent(course.id, schoolId, id, true);
      } catch {
        // skip courses that fail to unenroll (e.g. already removed)
      }
    }

    const currentMonth = this.paymentService.getCurrentMonthKey();
    const payments = await this.paymentRepo.find({ where: { studentId: id, schoolId } });
    const futurePayments = payments.filter((p) => p.month && p.month > currentMonth);
    const keptPayments = payments.filter((p) => !(p.month && p.month > currentMonth));
    if (futurePayments.length > 0) {
      await this.paymentRepo.remove(futurePayments);
    }
    if (keptPayments.length > 0) {
      for (const p of keptPayments) {
        p.studentFullName = `${student.firstName} ${student.lastName}`;
      }
      await this.paymentRepo.save(keptPayments);
    }
    return this.studentRepo.remove(student);
  }

  async getStudentDeletePreview(id: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['enrolledCourses'],
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const courseRefundItems: any[] = [];
    let courseRefundTotal = 0;
    for (const course of student.enrolledCourses || []) {
      try {
        const preview = await courseService.getUnenrollPreview(course.id, schoolId, id);
        if (preview.items.length > 0) {
          for (const item of preview.items) {
            courseRefundItems.push({
              courseId: course.id,
              courseName: course.name,
              ...item,
            });
          }
          courseRefundTotal += preview.refundAmount;
        }
      } catch {
        // skip
      }
    }

    const currentMonth = this.paymentService.getCurrentMonthKey();
    const payments = await this.paymentRepo.find({ where: { studentId: id, schoolId } });
    const legacyRefundItems = payments
      .filter((p) => p.month && p.month > currentMonth)
      .map((p) => ({ id: p.id, month: p.month, amount: Number(p.amount) }));
    const legacyRefundTotal = legacyRefundItems.reduce((s, i) => s + i.amount, 0);

    return {
      courseRefundItems,
      courseRefundTotal,
      legacyRefundItems,
      legacyRefundTotal,
      totalRefund: courseRefundTotal + legacyRefundTotal,
    };
  }
}

export const schoolAdminStudentsService = new SchoolAdminStudentsService();
