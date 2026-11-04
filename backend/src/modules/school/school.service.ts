import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { School } from './school.entity';
import { SchoolAdmin } from '../schoolAdmin/schoolAdmin.entity';
import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Parent } from '../parent/parent.entity';
import { Message } from '../message/message.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { hashPassword } from '../../shared/utils/hash';

export class SchoolService {
  constructor(
    private readonly schoolRepo = AppDataSource.getRepository(School),
    private readonly schoolAdminRepo = AppDataSource.getRepository(SchoolAdmin),
    private readonly dataSource = AppDataSource,
  ) {}

  private async countBySchool(tableName: 'school_admins' | 'teachers' | 'parents' | 'students', ids: string[]) {
    if (ids.length === 0) return new Map<string, number>();
    const rows = await this.dataSource.createQueryBuilder()
      .select(`${tableName}.schoolId`, 'schoolId')
      .addSelect('COUNT(*)', 'cnt')
      .from(tableName, tableName)
      .where(`${tableName}.schoolId IN (:...ids)`, { ids })
      .andWhere(`${tableName}.isActive = :isActive`, { isActive: true })
      .groupBy(`${tableName}.schoolId`)
      .getRawMany<{ schoolId: string; cnt: string }>();
    return new Map(rows.map((r) => [r.schoolId, Number(r.cnt)]));
  }

  private async countMessagesBySchool(ids: string[]) {
    if (ids.length === 0) return new Map<string, number>();
    const rows = await this.dataSource.createQueryBuilder()
      .select('message.schoolId', 'schoolId')
      .addSelect('COUNT(*)', 'cnt')
      .from(Message, 'message')
      .where('message.schoolId IN (:...ids)', { ids })
      .groupBy('message.schoolId')
      .getRawMany<{ schoolId: string; cnt: string }>();
    return new Map(rows.map((r) => [r.schoolId, Number(r.cnt)]));
  }

  async getUsersCount(schoolId: string) {
    const ids = [schoolId];
    const admins = await this.countBySchool('school_admins', ids);
    const teachers = await this.countBySchool('teachers', ids);
    const parents = await this.countBySchool('parents', ids);
    const students = await this.countBySchool('students', ids);
    return (admins.get(schoolId) ?? 0) + (teachers.get(schoolId) ?? 0) + (parents.get(schoolId) ?? 0) + (students.get(schoolId) ?? 0);
  }

  async getMessagesCount(schoolId: string) {
    const counts = await this.countMessagesBySchool([schoolId]);
    return counts.get(schoolId) ?? 0;
  }

  async assertUsersCapacity(schoolId: string) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    const current = await this.getUsersCount(schoolId);
    if (current >= school.maxUsers) {
      throw ApiError.badRequest(`تم بلوغ الحد الأقصى لعدد المستخدمين (${school.maxUsers})`);
    }
  }

  async assertMessagesCapacity(schoolId: string) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    const current = await this.getMessagesCount(schoolId);
    if (current >= school.maxMessages) {
      throw ApiError.badRequest(`تم بلوغ الحد الأقصى لعدد الرسائل (${school.maxMessages})`);
    }
  }

  async getAll(page = 1, limit = 20, search?: string) {
    const qb = this.schoolRepo.createQueryBuilder('school');

    if (search) {
      qb.where('(school.name LIKE :search OR school.slug LIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('school.createdAt', 'DESC')
      .getMany();

    if (data.length > 0) {
      const ids = data.map((s) => s.id);
      const [adminCounts, teacherCounts, parentCounts, studentCounts, messageCounts] = await Promise.all([
        this.countBySchool('school_admins', ids),
        this.countBySchool('teachers', ids),
        this.countBySchool('parents', ids),
        this.countBySchool('students', ids),
        this.countMessagesBySchool(ids),
      ]);
      for (const school of data) {
        school.currentUsers =
          (adminCounts.get(school.id) ?? 0) +
          (teacherCounts.get(school.id) ?? 0) +
          (parentCounts.get(school.id) ?? 0) +
          (studentCounts.get(school.id) ?? 0);
        school.currentMessages = messageCounts.get(school.id) ?? 0;
        (school as any).studentCount = studentCounts.get(school.id) ?? 0;
      }
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async attachCounts(school: School) {
    const ids = [school.id];
    const [admins, teachers, parents, students, messages] = await Promise.all([
      this.countBySchool('school_admins', ids),
      this.countBySchool('teachers', ids),
      this.countBySchool('parents', ids),
      this.countBySchool('students', ids),
      this.countMessagesBySchool(ids),
    ]);
    const studentsCount = students.get(school.id) ?? 0;
    school.currentUsers =
      (admins.get(school.id) ?? 0) +
      (teachers.get(school.id) ?? 0) +
      (parents.get(school.id) ?? 0) +
      studentsCount;
    school.currentMessages = messages.get(school.id) ?? 0;
    (school as any).studentCount = studentsCount;
    return school;
  }

  async getById(id: string) {
    const school = await this.schoolRepo.findOne({ where: [{ id }, { slug: id }] });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    return this.attachCounts(school);
  }

  async getBySlug(slug: string) {
    const school = await this.schoolRepo.findOne({ where: [{ slug }, { id: slug }] });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    return this.attachCounts(school);
  }

  async create(data: any) {
    const existingSlug = await this.schoolRepo.findOne({ where: { slug: data.slug } });
    if (existingSlug) {
      throw ApiError.conflict('معرف المدرسة موجود مسبقاً');
    }

    const { adminFirstName, adminLastName, adminPhone, adminPassword, monthlyFee, ...schoolData } = data;
    const school = this.schoolRepo.create(schoolData as DeepPartial<School>);
    const savedSchool = await this.schoolRepo.save(school);

    if (adminFirstName && adminPhone && adminPassword) {
      const hashedPassword = await hashPassword(adminPassword);
      const admin = this.schoolAdminRepo.create({
        firstName: adminFirstName,
        lastName: adminLastName || '',
        phone: adminPhone,
        password: hashedPassword,
        schoolId: savedSchool.id,
        role: 'school_admin',
        isActive: true,
      });
      await this.schoolAdminRepo.save(admin);
    }

    return savedSchool;
  }

  async update(id: string, data: Partial<School>) {
    const school = await this.schoolRepo.findOne({ where: [{ id }, { slug: id }] });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    const { monthlyFee, ...updateData } = data;
    Object.assign(school, updateData);
    return this.schoolRepo.save(school);
  }

  async delete(id: string) {
    const school = await this.schoolRepo.findOne({ where: [{ id }, { slug: id }] });
    if (!school) {
      throw ApiError.notFound('المدرسة غير موجودة');
    }
    await this.schoolRepo.remove(school);
    console.log(`[SchoolService] Deleted school: ${id}`);
  }

  async incrementUsers(schoolId: string) {
    await this.schoolRepo.increment({ id: schoolId }, 'currentUsers', 1);
  }

  async decrementUsers(schoolId: string) {
    await this.schoolRepo.decrement({ id: schoolId }, 'currentUsers', 1);
  }

  async incrementMessages(schoolId: string) {
    await this.schoolRepo.increment({ id: schoolId }, 'currentMessages', 1);
  }
}

export const schoolService = new SchoolService();
