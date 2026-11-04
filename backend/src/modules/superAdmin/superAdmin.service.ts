import { AppDataSource } from '../../config/data-source';
import { SuperAdmin } from './superAdmin.entity';
import { SchoolAdmin } from '../schoolAdmin/schoolAdmin.entity';
import { School } from '../school/school.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Parent } from '../parent/parent.entity';
import { Student } from '../student/student.entity';
import { Payment } from '../payment/payment.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { clearLoginFailures, isLoginLocked, loginThrottleKey, recordLoginFailure } from '../../shared/utils/loginThrottle';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt';
import { LoginDTO } from './dto/login.dto';

export class SuperAdminService {
  constructor(
    private readonly superAdminRepo = AppDataSource.getRepository(SuperAdmin),
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly teacherRepo = AppDataSource.getRepository(Teacher),
    private readonly parentRepo = AppDataSource.getRepository(Parent),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly schoolAdminRepo = AppDataSource.getRepository(SchoolAdmin),
  ) {}

  async login(dto: LoginDTO) {
    const throttleKey = loginThrottleKey(dto.phone, 'super-admin');
    if (isLoginLocked(throttleKey)) throw ApiError.tooMany('Too many failed login attempts; account is temporarily locked');
    const admin = await this.superAdminRepo.findOne({ where: { phone: dto.phone } });
    if (!admin) {
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!admin.isActive) {
      throw ApiError.forbidden('الحساب معطّل');
    }

    const isPasswordValid = await comparePassword(dto.password, admin.password);
    if (!isPasswordValid) {
      recordLoginFailure(throttleKey);
      throw ApiError.unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
    }
    clearLoginFailures(throttleKey);

    const tokenPayload = { id: admin.id, role: 'super_admin' as const, tv: admin.tokenVersion || 0 };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        role: 'super_admin',
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(id: string) {
    const admin = await this.superAdminRepo.findOne({ where: { id } });
    if (!admin) {
      throw ApiError.notFound('المسؤول غير موجود');
    }

    const tokenPayload = { id: admin.id, role: 'super_admin' as const, tv: admin.tokenVersion || 0 };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { accessToken, refreshToken };
  }

  async createSchool(data: any) {
    const existingSlug = await this.schoolRepo.findOne({ where: { slug: data.slug } });
    if (existingSlug) {
      throw ApiError.conflict('معرف المدرسة موجود مسبقاً');
    }

    const { monthlyFee, ...schoolData } = data;
    const school = this.schoolRepo.create(schoolData);
    return this.schoolRepo.save(school);
  }

  async getAllSchools(page = 1, limit = 20, search?: string) {
    const qb = this.schoolRepo.createQueryBuilder('school');

    if (search) {
      qb.where('school.name LIKE :search OR school.slug LIKE :search', {
        search: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('school.createdAt', 'DESC')
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSchoolById(id: string) {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    return school;
  }

  async updateSchool(id: string, data: any) {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }

    const { monthlyFee, ...schoolData } = data;
    Object.assign(school, schoolData);
    return this.schoolRepo.save(school);
  }

  async freezeSchool(id: string) {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }

    school.isFrozen = true;
    return this.schoolRepo.save(school);
  }

  async unfreezeSchool(id: string) {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }

    school.isFrozen = false;
    return this.schoolRepo.save(school);
  }

  async deleteSchool(id: string) {
    const school = await this.schoolRepo.findOne({ where: { id } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }

    school.isActive = false;
    return this.schoolRepo.save(school);
  }

  async getStats(period: 'week' | 'month' | 'year' = 'month') {
    const periodFormat: Record<string, string> = {
      week: "%Y-W%u",
      month: "%Y-%m",
      year: "%Y",
    };
    const periodLimit: Record<string, number> = { week: 12, month: 12, year: 5 };
    const fmt = periodFormat[period] || periodFormat.month;

    const monthNames: Record<string, string> = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر',
    };

    const formatLabel = (key: string): string => {
      if (period === 'year') return key;
      if (period === 'week') {
        const weekNum = key.split('-W')[1];
        return `الأسبوع ${weekNum}`;
      }
      const monthNum = key.split('-')[1];
      return monthNames[monthNum] || key;
    };

    const totalSchools = await this.schoolRepo.count();
    const activeSchools = await this.schoolRepo.count({ where: { isActive: true } });
    const frozenSchools = await this.schoolRepo.count({ where: { isFrozen: true } });
    const totalTeachers = await this.teacherRepo.count();
    const totalParents = await this.parentRepo.count();
    const totalStudents = await this.studentRepo.count();

    const schoolTypes = await this.schoolRepo
      .createQueryBuilder('school')
      .select('school.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('school.type')
      .getRawMany();

    const schoolTypeMap: Record<string, string> = { quranic: 'قرآنية', private: 'خاصة', kindergarten: 'رياض أطفال' };
    const schoolTypesFormatted = schoolTypes.map((s: any) => ({ type: schoolTypeMap[s.type] || s.type, count: Number(s.count) }));

    const monthlyRegistrations = await this.schoolRepo
      .createQueryBuilder('school')
      .select(`DATE_FORMAT(school.createdAt, '${fmt}')`, 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy(`DATE_FORMAT(school.createdAt, '${fmt}')`)
      .orderBy(`DATE_FORMAT(school.createdAt, '${fmt}')`, 'ASC')
      .limit(periodLimit[period] || periodLimit.month)
      .getRawMany();

    const monthlyRegistrationsFormatted = monthlyRegistrations.map((r: any) => ({
      month: formatLabel(r.month),
      count: Number(r.count),
    }));

    const userGrowth = await this.studentRepo
      .createQueryBuilder('student')
      .select(`DATE_FORMAT(student.createdAt, '${fmt}')`, 'date')
      .addSelect('COUNT(*)', 'students')
      .groupBy(`DATE_FORMAT(student.createdAt, '${fmt}')`)
      .orderBy(`DATE_FORMAT(student.createdAt, '${fmt}')`, 'ASC')
      .limit(periodLimit[period] || periodLimit.month)
      .getRawMany();

    const teacherGrowth = await this.teacherRepo
      .createQueryBuilder('teacher')
      .select(`DATE_FORMAT(teacher.createdAt, '${fmt}')`, 'date')
      .addSelect('COUNT(*)', 'teachers')
      .groupBy(`DATE_FORMAT(teacher.createdAt, '${fmt}')`)
      .orderBy(`DATE_FORMAT(teacher.createdAt, '${fmt}')`, 'ASC')
      .limit(periodLimit[period] || periodLimit.month)
      .getRawMany();

    const parentGrowth = await this.parentRepo
      .createQueryBuilder('parent')
      .select(`DATE_FORMAT(parent.createdAt, '${fmt}')`, 'date')
      .addSelect('COUNT(*)', 'parents')
      .groupBy(`DATE_FORMAT(parent.createdAt, '${fmt}')`)
      .orderBy(`DATE_FORMAT(parent.createdAt, '${fmt}')`, 'ASC')
      .limit(periodLimit[period] || periodLimit.month)
      .getRawMany();

    const growthMap = new Map<string, { date: string; students: number; teachers: number; parents: number }>();
    userGrowth.forEach((r: any) => {
      growthMap.set(r.date, { date: r.date, students: Number(r.students), teachers: 0, parents: 0 });
    });
    teacherGrowth.forEach((r: any) => {
      const existing = growthMap.get(r.date) || { date: r.date, students: 0, teachers: 0, parents: 0 };
      existing.teachers = Number(r.teachers);
      growthMap.set(r.date, existing);
    });
    parentGrowth.forEach((r: any) => {
      const existing = growthMap.get(r.date) || { date: r.date, students: 0, teachers: 0, parents: 0 };
      existing.parents = Number(r.parents);
      growthMap.set(r.date, existing);
    });
    const userGrowthFormatted = Array.from(growthMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({ ...r, date: formatLabel(r.date) }));

    const revenueData = await this.paymentRepo
      .createQueryBuilder('payment')
      .select(`DATE_FORMAT(payment.createdAt, '${fmt}')`, 'month')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy(`DATE_FORMAT(payment.createdAt, '${fmt}')`)
      .orderBy(`DATE_FORMAT(payment.createdAt, '${fmt}')`, 'ASC')
      .limit(periodLimit[period] || periodLimit.month)
      .getRawMany();

    const revenueDataFormatted = revenueData.map((r: any) => ({
      month: formatLabel(r.month),
      amount: Number(r.amount),
    }));

    return {
      totalSchools,
      activeSchools,
      frozenSchools,
      totalUsers: totalStudents + totalTeachers + totalParents,
      totalTeachers,
      totalParents,
      totalStudents,
      totalRevenue: revenueDataFormatted.reduce((sum: number, r: any) => sum + r.amount, 0),
      monthlyRevenue: revenueDataFormatted.length > 0 ? revenueDataFormatted[revenueDataFormatted.length - 1].amount : 0,
      schoolTypeBreakdown: {
        quranic: schoolTypes.find((s: any) => s.type === 'quranic')?.count || 0,
        private: schoolTypes.find((s: any) => s.type === 'private')?.count || 0,
        kindergarten: schoolTypes.find((s: any) => s.type === 'kindergarten')?.count || 0,
      },
      recentActivity: [],
      monthlyRegistrations: monthlyRegistrationsFormatted,
      schoolTypes: schoolTypesFormatted,
      userGrowth: userGrowthFormatted,
      revenueData: revenueDataFormatted,
    };
  }

  async getSchoolAdmin(schoolId: string) {
    const admin = await this.schoolAdminRepo.findOne({
      where: { school: { id: schoolId } },
      select: ['id', 'firstName', 'lastName', 'phone', 'isActive'],
    });
    if (!admin) throw ApiError.notFound('لا يوجد مسؤول لهذه المدرسة');
    return admin;
  }
}

export const superAdminService = new SuperAdminService();
