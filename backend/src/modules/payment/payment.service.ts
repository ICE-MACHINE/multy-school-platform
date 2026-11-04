import { AppDataSource } from '../../config/data-source';
import { Payment } from './payment.entity';
import { Student } from '../student/student.entity';
import { Course } from '../course/course.entity';
import { StudentExemptionPeriod } from '../student/studentExemptionPeriod.entity';
import { School } from '../school/school.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { generateReceiptNumber } from '../../shared/utils/encryption';
import { isMonthExempted } from './paymentStatus.util';
import { courseSessionService } from '../courseSession/courseSession.service';
import {
  resolveCoursePaymentType,
  coursePriceForType,
  courseRequiredMonths,
  toMonthKey,
  type CoursePaymentType,
} from '../course/coursePricing.util';

export class PaymentService {
  constructor(
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly courseRepo = AppDataSource.getRepository(Course),
    private readonly exemptionPeriodRepo = AppDataSource.getRepository(StudentExemptionPeriod),
    private readonly schoolRepo = AppDataSource.getRepository(School),
  ) {}

  getCurrentMonthKey(now: Date = new Date()): string {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async getAll(schoolId: string, page = 1, limit = 20, studentId?: string, month?: string, search?: string) {
    const qb = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .where('payment.schoolId = :schoolId', { schoolId });

    if (studentId) {
      qb.andWhere('payment.studentId = :studentId', { studentId });
    }

    if (month) {
      qb.andWhere('payment.month = :month', { month });
    }

    if (search) {
      qb.andWhere('(student.firstName LIKE :search OR student.lastName LIKE :search OR payment.studentFullName LIKE :search)', { search: `%${search}%` });
    }

    const total = await qb.getCount();

    const sumResult = await qb
      .clone()
      .select('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .getRawOne();
    const totalAmount = Number(sumResult?.totalAmount || 0);

    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit), totalAmount };
  }

  async create(schoolId: string, data: any) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }

    const student = await this.studentRepo.findOne({
      where: { id: data.studentId, school: { id: schoolId } },
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    if (student.isExemptFromPayment) {
      throw ApiError.badRequest('التلميذ معفاة من الدفع');
    }

    const receiptNumber = generateReceiptNumber();
    const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];

    if (school.type === 'private') {
      const payment = await this.createPrivateSchoolPayment(schoolId, student, data, receiptNumber, paymentDate);
      return this.paymentRepo.save(payment);
    }

    if (!data.month) {
      throw ApiError.badRequest('يجب تحديد الشهر المدفوع');
    }

    const existing = await this.paymentRepo.findOne({
      where: { student: { id: data.studentId }, month: data.month, school: { id: schoolId } },
    });
    if (existing) {
      throw ApiError.conflict('هذا التلميذ قد دفع بالفعل عن هذا الشهر');
    }

    const payment = this.paymentRepo.create({
      ...data,
      amount: Number(school.monthlyFee),
      schoolId,
      receiptNumber,
      studentFullName: `${student.firstName} ${student.lastName}`,
      paymentDate,
    });
    return this.paymentRepo.save(payment);
  }

  private async createPrivateSchoolPayment(
    schoolId: string,
    student: Student,
    data: any,
    receiptNumber: string,
    paymentDate: string,
  ) {
    if (!data.courseId) {
      throw ApiError.badRequest('يجب اختيار الدورة المدفوعة');
    }

    const course = await this.courseRepo.findOne({ where: { id: data.courseId, school: { id: schoolId } } });
    if (!course) {
      throw ApiError.notFound('الدورة غير موجودة');
    }

    const enrolled = await this.studentRepo
      .createQueryBuilder('student')
      .innerJoin('student.enrolledCourses', 'enrolledCourse')
      .where('student.id = :studentId', { studentId: student.id })
      .andWhere('enrolledCourse.id = :courseId', { courseId: course.id })
      .getOne();
    if (!enrolled) {
      throw ApiError.badRequest('التلميذ غير مسجّل في هذه الدورة - يجب تسجيله أولاً');
    }

    const resolvedType = this.resolvePaymentType(course, data.paymentType);

    let amount = 0;
    let month: string | undefined;
    let sessionNumber: number | undefined;

    if (resolvedType === 'month') {
      if (!data.month) {
        throw ApiError.badRequest('يجب تحديد الشهر المدفوع للدورة');
      }
      if (course.startDate && toMonthKey(course.startDate) > data.month) {
        throw ApiError.badRequest('لا يمكن الدفع عن شهر يسبق تاريخ بداية الدورة');
      }
      const existing = await this.paymentRepo.findOne({
        where: {
          student: { id: student.id },
          course: { id: course.id },
          month: data.month,
          paymentType: 'month',
          school: { id: schoolId },
        },
      });
      if (existing) {
        throw ApiError.conflict('هذا التلميذ قد دفع بالفعل عن هذا الشهر في هذه الدورة');
      }
      month = data.month;
      amount = coursePriceForType(course, 'month');
    } else if (resolvedType === 'session') {
      const totalSessions = Number(course.numberOfSessions || 0);
      const session = Number(data.sessionNumber);
      if (!Number.isInteger(session) || session < 1) {
        throw ApiError.badRequest('يجب تحديد رقم الحصة المدفوعة');
      }
      if (totalSessions > 0 && session > totalSessions) {
        throw ApiError.badRequest(`رقم الحصة يجب أن يكون بين 1 و ${totalSessions}`);
      }
      const completedSessionNumbers = await courseSessionService.getCompletedSessionNumbers(course.id);
      if (completedSessionNumbers.has(session)) {
        throw ApiError.badRequest('لا يمكن الدفع عن هذه الحصة لأنها اكتملت - يجب الدفع من الحصة التالية');
      }
      const existing = await this.paymentRepo.findOne({
        where: {
          student: { id: student.id },
          course: { id: course.id },
          sessionNumber: session,
          paymentType: 'session',
          school: { id: schoolId },
        },
      });
      if (existing) {
        throw ApiError.conflict('هذه الحصة قد دفعها التلميذ بالفعل في هذه الدورة');
      }
      sessionNumber = session;
      amount = coursePriceForType(course, 'session');
    } else {
      const existing = await this.paymentRepo.findOne({
        where: {
          student: { id: student.id },
          course: { id: course.id },
          paymentType: 'course',
          school: { id: schoolId },
        },
      });
      if (existing) {
        throw ApiError.conflict('هذا التلميذ قد دفع بالفعل كامل هذه الدورة');
      }
      amount = coursePriceForType(course, 'course');
    }

    return this.paymentRepo.create({
      amount,
      month,
      sessionNumber,
      courseId: course.id,
      courseName: course.name,
      paymentType: resolvedType,
      studentId: student.id,
      schoolId,
      receiptNumber,
      studentFullName: `${student.firstName} ${student.lastName}`,
      paymentDate,
      description: data.description,
    });
  }

  private resolvePaymentType(course: Course, requested?: string): CoursePaymentType {
    const available = resolveCoursePaymentType(course);
    if (!available) {
      throw ApiError.badRequest('هذه الدورة لا تحدد طريقة دفع - يرجى تعديل الدورة');
    }
    if (requested && requested !== available) {
      throw ApiError.badRequest('طريقة الدفع المطلوبة غير متاحة لهذه الدورة');
    }
    return available;
  }

  /**
   * For private schools only: returns every enrolled course of a student with
   * its payment method, price and which parts have already been paid, so the
   * UI can show exactly what the student owes per course.
   */
  async getStudentCoursePayments(studentId: string, schoolId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['enrolledCourses'],
    });
    if (!student) {
      throw ApiError.notFound('التلميذ غير موجود');
    }

    const courses = student.enrolledCourses || [];
    if (courses.length === 0) return [];

    const payments = await this.paymentRepo.find({
      where: courses.map((c) => ({
        student: { id: studentId },
        course: { id: c.id },
        school: { id: schoolId },
      })),
    });

    const byCourse = new Map<string, Payment[]>();
    for (const p of payments) {
      if (!p.courseId) continue;
      if (!byCourse.has(p.courseId)) byCourse.set(p.courseId, []);
      byCourse.get(p.courseId)!.push(p);
    }

    const now = new Date();

    const completedByCourse = new Map<string, Set<number>>();
    for (const c of courses) {
      if (resolveCoursePaymentType(c) === 'session') {
        completedByCourse.set(c.id, await courseSessionService.getCompletedSessionNumbers(c.id));
      }
    }

    return courses.map((course) => {
      const type = resolveCoursePaymentType(course);
      const coursePayments = byCourse.get(course.id) || [];
      let paidCount = 0;
      let totalRequired = 0;
      let isPaid = false;
      let paidMonths: string[] = [];
      let paidSessions: number[] = [];
      let isCoursePaid = false;

      if (type === 'month') {
        const required = courseRequiredMonths(course, now);
        totalRequired = required.length;
        const paidSet = new Set(
          coursePayments
            .filter((p) => !p.refunded && p.paymentType === 'month' && p.month)
            .map((p) => p.month),
        );
        paidMonths = Array.from(paidSet);
        paidCount = required.filter((m) => paidSet.has(m)).length;
        isPaid = required.length > 0 && required.every((m) => paidSet.has(m));
      } else if (type === 'session') {
        const totalSessions = Number(course.numberOfSessions || 0);
        totalRequired = totalSessions;
        paidSessions = coursePayments
          .filter((p) => !p.refunded && p.paymentType === 'session' && p.sessionNumber != null)
          .map((p) => Number(p.sessionNumber));
        paidCount = paidSessions.length;
        isPaid = totalSessions > 0 && paidCount >= totalSessions;
      } else {
        totalRequired = 1;
        isCoursePaid = coursePayments.some((p) => !p.refunded && p.paymentType === 'course');
        paidCount = isCoursePaid ? 1 : 0;
        isPaid = isCoursePaid;
      }

      let completedSessions: number[] = [];
      let nextPayableSession: number | null = null;
      if (type === 'session') {
        completedSessions = Array.from(completedByCourse.get(course.id) || new Set<number>()).sort((a, b) => a - b);
        const maxDone = Math.max(0, ...completedSessions, ...paidSessions);
        if (Number(course.numberOfSessions || 0) > 0 && maxDone < Number(course.numberOfSessions || 0)) {
          nextPayableSession = maxDone + 1;
        }
      }

      return {
        course: {
          id: course.id,
          name: course.name,
          startDate: course.startDate,
          numberOfSessions: course.numberOfSessions,
        },
        paymentType: type,
        price: type ? coursePriceForType(course, type) : 0,
        totalRequired,
        paidCount,
        isPaid,
        paidMonths,
        paidSessions,
        isCoursePaid,
        completedSessions,
        nextPayableSession,
      };
    });
  }

  async update(id: string, schoolId: string, data: any) {
    const payment = await this.paymentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!payment) {
      throw ApiError.notFound('الدفع غير موجود');
    }
    Object.assign(payment, data);
    return this.paymentRepo.save(payment);
  }

  async delete(id: string, schoolId: string) {
    const payment = await this.paymentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!payment) {
      throw ApiError.notFound('الدفع غير موجود');
    }
    await this.paymentRepo.remove(payment);
  }

  async getStudentPayments(studentId: string, schoolId: string) {
    return this.paymentRepo.find({
      where: { student: { id: studentId }, school: { id: schoolId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getReceiptById(id: string, schoolId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['student', 'recordedBy', 'school'],
    });
    if (!payment) throw ApiError.notFound('الدفعة غير موجودة');
    return { ...payment, schoolName: payment.school?.name || '' };
  }

  async getMonthlyStats(schoolId: string, month: string) {
    const payments = await this.paymentRepo
      .createQueryBuilder('payment')
      .where("payment.schoolId = :schoolId AND DATE_FORMAT(payment.createdAt, '%Y-%m') = :month", { schoolId, month })
      .getMany();

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      month,
      totalPayments: payments.length,
      totalAmount,
      averageAmount: payments.length > 0 ? (totalAmount / payments.length).toFixed(2) : '0',
    };
  }

  async getAvailableMonths(schoolId: string) {
    const rows = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('payment.month', 'month')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.schoolId = :schoolId', { schoolId })
      .andWhere('payment.month IS NOT NULL')
      .groupBy('payment.month')
      .orderBy('payment.month', 'ASC')
      .getRawMany();

    return rows.map((r) => ({ month: r.month, count: Number(r.count || 0) }));
  }

  async getForPrint(schoolId: string, months: string[]) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });

    if (!months.length) {
      return { schoolName: school?.name || '', data: [] };
    }

    const data = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .where('payment.schoolId = :schoolId', { schoolId })
      .andWhere('payment.month IN (:...months)', { months })
      .orderBy('payment.month', 'ASC')
      .addOrderBy('payment.paymentDate', 'ASC')
      .addOrderBy('payment.createdAt', 'ASC')
      .getMany();

    return { schoolName: school?.name || '', data };
  }

  async checkRemainingMonths(studentId: string, schoolId: string) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }

    const student = await this.studentRepo.findOne({ where: { id: studentId, school: { id: schoolId } } });
    if (student?.isExemptFromPayment) {
      return { monthlyFee: Number(school.monthlyFee), paidMonths: 0, remainingMonths: 0, paidMonthList: [], exempt: true };
    }

    const monthlyFee = Number(school.monthlyFee);
    if (monthlyFee <= 0) {
      return { remainingMonths: 0, monthlyFee, exempt: false };
    }

    const paidMonths = await this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.studentId = :studentId AND payment.schoolId = :schoolId AND payment.month IS NOT NULL', { studentId, schoolId })
      .getMany();

    const paidMonthSet = new Set(paidMonths.map(p => p.month));
    const paidCount = paidMonthSet.size;

    const exemptionPeriods = await this.exemptionPeriodRepo.find({ where: { studentId } });
    const now = new Date();
    let remainingMonths = 0;
    for (let m = 1; m <= 12; m++) {
      const key = `${now.getFullYear()}-${String(m).padStart(2, '0')}`;
      if (!paidMonthSet.has(key) && !isMonthExempted(key, exemptionPeriods)) {
        remainingMonths++;
      }
    }

    return {
      monthlyFee,
      paidMonths: paidCount,
      remainingMonths,
      paidMonthList: Array.from(paidMonthSet),
      exempt: false,
    };
  }
}

export const paymentService = new PaymentService();
