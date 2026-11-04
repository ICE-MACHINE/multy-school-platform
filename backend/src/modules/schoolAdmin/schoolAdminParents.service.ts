import { AppDataSource } from '../../config/data-source';
import { Parent } from '../parent/parent.entity';
import { Student } from '../student/student.entity';
import { Payment } from '../payment/payment.entity';
import { SchoolService, schoolService as defaultSchoolService } from '../school/school.service';
import { PaymentService, paymentService as defaultPaymentService } from '../payment/payment.service';
import { courseService } from '../course/course.service';
import { ApiError } from '../../shared/utils/ApiError';
import { bumpTokenVersion } from '../../shared/auth/sessionRevocation';
import { hashPassword } from '../../shared/utils/hash';
import { assertPhoneUniqueAcrossRoles } from '../../shared/utils/phoneUniqueness';

export class SchoolAdminParentsService {
  constructor(
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly schoolService: SchoolService = defaultSchoolService,
    private readonly paymentService: PaymentService = defaultPaymentService,
  ) {}

  async getAllParents(schoolId: string, page = 1, limit = 20, search?: string) {
    const qb = this.parentRepo.createQueryBuilder('parent')
      .where('parent.schoolId = :schoolId', { schoolId })
      .loadRelationCountAndMap('parent.childrenCount', 'parent.children');

    if (search) {
      qb.andWhere('(parent.firstName LIKE :search OR parent.lastName LIKE :search OR parent.phone LIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb
      .select(['parent.id', 'parent.firstName', 'parent.lastName', 'parent.phone', 'parent.gender', 'parent.isActive'])
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('parent.firstName', 'ASC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getParentById(id: string, schoolId: string) {
    const parent = await this.parentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['children'],
    });
    if (!parent) throw ApiError.notFound('ولي الأمر غير موجود');
    return parent;
  }

  async createParent(schoolId: string, data: any) {
    if (!schoolId) {
      throw ApiError.badRequest('معرف المدرسة مطلوب');
    }
    await this.schoolService.assertUsersCapacity(schoolId);
    await assertPhoneUniqueAcrossRoles(schoolId, data.phone);

    const hashedPassword = await hashPassword(data.password);
    const parent = this.parentRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      placeOfResidence: data.placeOfResidence,
      gender: data.gender,
      phone: data.phone,
      schoolId,
      password: hashedPassword,
    });
    return this.parentRepo.save(parent);
  }

  async updateParent(id: string, schoolId: string, data: any) {
    const parent = await this.parentRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!parent) {
      throw ApiError.notFound('ولي الأمر غير موجود');
    }

    if (data.phone && data.phone !== parent.phone) {
      await assertPhoneUniqueAcrossRoles(schoolId, data.phone, { role: 'parent', id });
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    Object.assign(parent, data);
    const savedParent = await this.parentRepo.save(parent);
    await bumpTokenVersion('parent', id);
    return savedParent;
  }

  async deleteParent(id: string, schoolId: string) {
    const parent = await this.parentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['children'],
    });
    if (!parent) {
      throw ApiError.notFound('ولي الأمر غير موجود');
    }

    for (const child of parent.children || []) {
      const studentWithCourses = await this.studentRepo.findOne({
        where: { id: child.id, school: { id: schoolId } },
        relations: ['enrolledCourses'],
      });
      for (const course of studentWithCourses?.enrolledCourses || []) {
        try {
          await courseService.unenrollStudent(course.id, schoolId, child.id, true);
        } catch {
          // skip
        }
      }
    }

    const currentMonth = this.paymentService.getCurrentMonthKey();
    for (const child of parent.children || []) {
      const payments = await this.paymentRepo.find({ where: { studentId: child.id, schoolId } });
      const futurePayments = payments.filter((p) => p.month && p.month > currentMonth);
      const keptPayments = payments.filter((p) => !(p.month && p.month > currentMonth));
      if (futurePayments.length > 0) {
        await this.paymentRepo.remove(futurePayments);
      }
      if (keptPayments.length > 0) {
        for (const p of keptPayments) {
          p.studentFullName = `${child.firstName} ${child.lastName}`;
        }
        await this.paymentRepo.save(keptPayments);
      }
    }
    if (parent.children && parent.children.length > 0) {
      await this.studentRepo.remove(parent.children);
    }
    await bumpTokenVersion('parent', id);
    return this.parentRepo.remove(parent);
  }

  async getParentDeletePreview(id: string, schoolId: string) {
    const parent = await this.parentRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['children'],
    });
    if (!parent) {
      throw ApiError.notFound('ولي الأمر غير موجود');
    }

    const courseRefundItems: any[] = [];
    let courseRefundTotal = 0;
    const legacyChildren: any[] = [];
    let legacyRefundTotal = 0;

    for (const child of parent.children || []) {
      const studentWithCourses = await this.studentRepo.findOne({
        where: { id: child.id, school: { id: schoolId } },
        relations: ['enrolledCourses'],
      });
      for (const course of studentWithCourses?.enrolledCourses || []) {
        try {
          const preview = await courseService.getUnenrollPreview(course.id, schoolId, child.id);
          if (preview.items.length > 0) {
            for (const item of preview.items) {
              courseRefundItems.push({
                studentId: child.id,
                studentName: `${child.firstName} ${child.lastName}`,
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
      const payments = await this.paymentRepo.find({ where: { studentId: child.id, schoolId } });
      const futurePayments = payments.filter((p) => p.month && p.month > currentMonth);
      if (futurePayments.length > 0) {
        const items = futurePayments.map((p) => ({ month: p.month, amount: Number(p.amount) }));
        const subtotal = items.reduce((s, i) => s + i.amount, 0);
        legacyRefundTotal += subtotal;
        legacyChildren.push({
          studentId: child.id,
          studentName: `${child.firstName} ${child.lastName}`,
          items,
          subtotal,
        });
      }
    }

    return {
      courseRefundItems,
      courseRefundTotal,
      legacyChildren,
      legacyRefundTotal,
      totalRefund: courseRefundTotal + legacyRefundTotal,
    };
  }
}

export const schoolAdminParentsService = new SchoolAdminParentsService();
