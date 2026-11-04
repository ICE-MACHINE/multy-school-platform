import { AppDataSource } from '../../config/data-source';
import { Parent } from '../parent/parent.entity';
import { Payment } from '../payment/payment.entity';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';

export interface SchoolSnapshot {
  id: string;
  name: string;
  slug: string;
  type: string;
  isActive: boolean;
  isFrozen: boolean;
  monthlyFee: number;
  maxUsers: number;
  currentUsers: number;
  userUsagePct: number;
  maxMessages: number;
  currentMessages: number;
  messageUsagePct: number;
  students: number;
  teachers: number;
  paymentsThisMonth: number;
  hasPaymentThisMonth: boolean;
  createdAt: Date | string;
}

export interface PlatformSnapshot {
  generatedAt: string;
  totals: {
    totalSchools: number;
    activeSchools: number;
    frozenSchools: number;
    inactiveSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
  };
  mrr: number;
  paymentsThisMonth: number;
  newSchoolsLast30Days: number;
  schoolsByType: { type: string; count: number }[];
  schools: SchoolSnapshot[];
}

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value as T);
  return loader().then((value) => {
    cache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  });
}

function pct(current: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.round((Number(current) / Number(max)) * 10000) / 100;
}

function defer<T>(fn: () => Promise<T>): Promise<T> {
  return Promise.resolve().then(fn);
}

function toCountMap(rows: Array<Record<string, unknown>>): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const schoolId = row.schoolId;
    if (typeof schoolId === 'string' && schoolId) {
      map.set(schoolId, Number(row.count) || 0);
    }
  }
  return map;
}

export async function buildPlatformSnapshot(): Promise<PlatformSnapshot> {
  return cached('super-admin-ai:platform-snapshot', CACHE_TTL_MS, async () => {
    const schoolRepo = AppDataSource.getRepository(School);
    const studentRepo = AppDataSource.getRepository(Student);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const parentRepo = AppDataSource.getRepository(Parent);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      schools,
      totalStudents,
      totalTeachers,
      totalParents,
      schoolsByTypeRaw,
      studentRows,
      teacherRows,
      paymentThisMonthRow,
      paymentsBySchoolRows,
      newSchoolsLast30Days,
    ] = await Promise.all([
      defer(() => schoolRepo.find({ order: { createdAt: 'ASC' } })),
      defer(() => studentRepo.count()),
      defer(() => teacherRepo.count()),
      defer(() => parentRepo.count()),
      defer(() =>
        schoolRepo
          .createQueryBuilder('school')
          .select('school.type', 'type')
          .addSelect('COUNT(*)', 'count')
          .groupBy('school.type')
          .getRawMany(),
      ),
      defer(() =>
        studentRepo
          .createQueryBuilder('student')
          .select('student.schoolId', 'schoolId')
          .addSelect('COUNT(*)', 'count')
          .groupBy('student.schoolId')
          .getRawMany(),
      ),
      defer(() =>
        teacherRepo
          .createQueryBuilder('teacher')
          .select('teacher.schoolId', 'schoolId')
          .addSelect('COUNT(*)', 'count')
          .groupBy('teacher.schoolId')
          .getRawMany(),
      ),
      defer(() =>
        paymentRepo
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .where("DATE_FORMAT(payment.createdAt, '%Y-%m') = :month", { month: currentMonth })
          .getRawOne(),
      ),
      defer(() =>
        paymentRepo
          .createQueryBuilder('payment')
          .select('payment.schoolId', 'schoolId')
          .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
          .addSelect('COUNT(*)', 'count')
          .where("DATE_FORMAT(payment.createdAt, '%Y-%m') = :month", { month: currentMonth })
          .groupBy('payment.schoolId')
          .getRawMany(),
      ),
      defer(() =>
        schoolRepo
          .createQueryBuilder('school')
          .where('school.createdAt >= :since', { since: since30 })
          .getCount(),
      ),
    ]);

    const studentsBySchool = toCountMap(studentRows as Array<Record<string, unknown>>);
    const teachersBySchool = toCountMap(teacherRows as Array<Record<string, unknown>>);
    const paymentsBySchool = new Map<string, { total: number; count: number }>();
    for (const row of paymentsBySchoolRows as Array<Record<string, unknown>>) {
      if (typeof row.schoolId === 'string' && row.schoolId) {
        paymentsBySchool.set(row.schoolId, {
          total: Number(row.total) || 0,
          count: Number(row.count) || 0,
        });
      }
    }

    const totalSchools = schools.length;
    const activeSchools = schools.filter((s) => s.isActive).length;
    const frozenSchools = schools.filter((s) => s.isFrozen).length;
    const mrr = schools
      .filter((s) => s.isActive && !s.isFrozen)
      .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);

    const schoolSnapshots: SchoolSnapshot[] = schools.map((school) => {
      const payment = paymentsBySchool.get(school.id);
      return {
        id: school.id,
        name: school.name,
        slug: school.slug,
        type: school.type,
        isActive: Boolean(school.isActive),
        isFrozen: Boolean(school.isFrozen),
        monthlyFee: Number(school.monthlyFee) || 0,
        maxUsers: Number(school.maxUsers) || 0,
        currentUsers: Number(school.currentUsers) || 0,
        userUsagePct: pct(Number(school.currentUsers) || 0, Number(school.maxUsers) || 0),
        maxMessages: Number(school.maxMessages) || 0,
        currentMessages: Number(school.currentMessages) || 0,
        messageUsagePct: pct(Number(school.currentMessages) || 0, Number(school.maxMessages) || 0),
        students: studentsBySchool.get(school.id) || 0,
        teachers: teachersBySchool.get(school.id) || 0,
        paymentsThisMonth: payment?.total || 0,
        hasPaymentThisMonth: (payment?.count || 0) > 0,
        createdAt: school.createdAt,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        totalSchools,
        activeSchools,
        frozenSchools,
        inactiveSchools: totalSchools - activeSchools,
        totalStudents,
        totalTeachers,
        totalParents,
      },
      mrr: Math.round(mrr * 100) / 100,
      paymentsThisMonth:
        Math.round((Number((paymentThisMonthRow as Record<string, unknown> | undefined)?.total) || 0) * 100) / 100,
      newSchoolsLast30Days,
      schoolsByType: (schoolsByTypeRaw as Array<Record<string, unknown>>).map((row) => ({
        type: String(row.type),
        count: Number(row.count) || 0,
      })),
      schools: schoolSnapshots,
    };
  });
}

export function clearPlatformSnapshotCache(): void {
  cache.clear();
}
