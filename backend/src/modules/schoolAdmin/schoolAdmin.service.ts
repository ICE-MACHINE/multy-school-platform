import { AppDataSource } from '../../config/data-source';
import { SchoolAdmin } from './schoolAdmin.entity';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Parent } from '../parent/parent.entity';
import { Student } from '../student/student.entity';
import { Classroom } from '../classroom/classroom.entity';
import { Payment } from '../payment/payment.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { clearLoginFailures, isLoginLocked, loginThrottleKey, recordLoginFailure } from '../../shared/utils/loginThrottle';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt';
import { assertPhoneUniqueAcrossRoles } from '../../shared/utils/phoneUniqueness';

export class SchoolAdminService {
  constructor(
    private readonly adminRepo = AppDataSource.getRepository(SchoolAdmin),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly classroomRepo = AppDataSource.getRepository(Classroom),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
  ) {}

  async login(dto: { phone: string; password: string; schoolId: string }) {
    const throttleKey = loginThrottleKey(dto.phone, dto.schoolId || 'platform');
    if (isLoginLocked(throttleKey)) throw ApiError.tooMany('Too many failed login attempts; account is temporarily locked');
    const admin = await this.adminRepo.findOne({
      where: { phone: dto.phone, school: { id: dto.schoolId } },
      relations: ['school'],
    });

    if (!admin) {
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!admin.isActive) {
      throw ApiError.forbidden('الحساب معطّل');
    }

    const school = await this.schoolRepo.findOne({ where: { id: dto.schoolId } });
    if (school && school.isFrozen) {
      throw ApiError.forbidden('المدرسة مجمّدة');
    }

    const isPasswordValid = await comparePassword(dto.password, admin.password);
    if (!isPasswordValid) {
      recordLoginFailure(throttleKey);
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }
    clearLoginFailures(throttleKey);

    const tokenPayload = { id: admin.id, role: 'school_admin' as const, tv: admin.tokenVersion || 0, schoolId: dto.schoolId, slug: school?.slug };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        role: 'school_admin',
        schoolId: dto.schoolId,
        schoolSlug: school?.slug,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(id: string, schoolId: string) {
    const admin = await this.adminRepo.findOne({ where: { id, school: { id: schoolId } } });
    if (!admin) {
      throw ApiError.notFound('المسؤول غير موجود');
    }

    const tokenPayload = { id: admin.id, role: 'school_admin' as const, tv: admin.tokenVersion || 0, schoolId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { accessToken, refreshToken };
  }

  async getDashboardStats(schoolId: string) {
    const totalTeachers = await this.teacherRepo.count({ where: { school: { id: schoolId } } });
    const totalParents = await this.parentRepo.count({ where: { school: { id: schoolId } } });
    const totalStudents = await this.studentRepo.count({ where: { school: { id: schoolId } } });
    const totalClassrooms = await this.classroomRepo.count({ where: { school: { id: schoolId } } });

    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    const currentMonth = new Date().toISOString().slice(0, 7);

    let qb = this.paymentRepo.createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId });
    if (school?.type === 'private') {
      qb = qb.andWhere("DATE_FORMAT(payment.paymentDate, '%Y-%m') = :month", { month: currentMonth });
    } else {
      qb = qb.andWhere('payment.month = :month', { month: currentMonth });
    }
    const monthlyPayments = await qb.getMany();

    const totalRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalTeachers,
      totalParents,
      totalStudents,
      totalClassrooms,
      totalRevenue,
      monthlyPaymentsCount: monthlyPayments.length,
    };
  }

  async createAdmin(data: any) {
    if (!data.schoolId) {
      throw ApiError.badRequest('معرف المدرسة مطلوب');
    }
    await assertPhoneUniqueAcrossRoles(data.schoolId, data.phone);

    const hashedPassword = await hashPassword(data.password);
    const admin = this.adminRepo.create({
      ...data,
      password: hashedPassword,
    });
    return this.adminRepo.save(admin);
  }

  async updateSchool(schoolId: string, data: { monthlyFee?: number }) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    if (data.monthlyFee !== undefined) {
      if (data.monthlyFee < 0) {
        throw ApiError.badRequest('قيمة الدفع الشهري يجب أن تكون 0 أو أكثر');
      }
      school.monthlyFee = data.monthlyFee;
    }
    return this.schoolRepo.save(school);
  }
}

export const schoolAdminService = new SchoolAdminService();
