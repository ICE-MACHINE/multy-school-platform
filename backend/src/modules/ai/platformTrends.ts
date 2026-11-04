import { AppDataSource } from '../../config/data-source';
import { Payment } from '../payment/payment.entity';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';
import { buildPlatformSnapshot, type PlatformSnapshot } from './platformSnapshot';
import {
  buildChurnRisks,
  buildContactToday,
  buildPlanRecommendations,
  diagnoseCollections,
  pctChange,
  type ChurnRisk,
  type ContactAction,
  type DiagnosisDriver,
  type PlanRecommendation,
  type SchoolCollectionsComparison,
} from './businessIntelligence';

export interface MonthlyPoint {
  month: string;
  collections: number;
  paymentCount: number;
  refundsAmount: number;
  newSchools: number;
  cumulativeSchools: number;
  newStudents: number;
  newTeachers: number;
}

export interface MetricComparison {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
}

export interface PlatformTrends {
  generatedAt: string;
  months: MonthlyPoint[];
  currentVsPrevious: {
    collections: MetricComparison;
    paymentCount: MetricComparison;
    newSchools: MetricComparison;
    newStudents: MetricComparison;
  };
  last3VsPrevious3Collections: MetricComparison;
  perSchoolCollections: SchoolCollectionsComparison[];
  drivers: DiagnosisDriver[];
  churnRisks: ChurnRisk[];
  planRecommendations: PlanRecommendation[];
  contactToday: ContactAction[];
  limitations: string[];
}

export function monthKeysEnding(now: Date, count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export function compareMetric(current: number, previous: number): MetricComparison {
  return {
    current,
    previous,
    delta: Math.round((current - previous) * 100) / 100,
    deltaPct: pctChange(current, previous),
  };
}

const LIMITATIONS = [
  'collections_are_school_tuition_not_platform_subscription_revenue',
  'monthly_fee_is_per_student_school_fee_not_saas_price',
  'no_cancellation_or_subscription_payment_event_history',
  'frozen_and_inactive_are_current_states_not_period_events',
];

let trendsCache: { expiresAt: number; value: PlatformTrends } | null = null;
const TRENDS_TTL_MS = 60 * 1000;

function monthMap(rows: Array<Record<string, unknown>>, valueKey = 'total'): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (typeof row.month === 'string') map.set(row.month, Number(row[valueKey]) || 0);
  }
  return map;
}

export async function buildPlatformTrends(now: Date = new Date()): Promise<PlatformTrends> {
  if (trendsCache && trendsCache.expiresAt > Date.now()) return trendsCache.value;

  const snapshot: PlatformSnapshot = await buildPlatformSnapshot();
  const months = monthKeysEnding(now, 6);
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  const startDate = `${months[0]}-01`;

  const paymentRepo = AppDataSource.getRepository(Payment);
  const schoolRepo = AppDataSource.getRepository(School);
  const studentRepo = AppDataSource.getRepository(Student);
  const teacherRepo = AppDataSource.getRepository(Teacher);

  const [
    collectionsRows,
    refundRows,
    schoolRows,
    studentRows,
    teacherRows,
    schoolsBeforeStart,
    perSchoolRows,
  ] = await Promise.all([
    paymentRepo
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.createdAt, '%Y-%m')", 'month')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('payment.createdAt >= :start', { start: startDate })
      .andWhere('(payment.refunded = 0 OR payment.refunded IS NULL)')
      .groupBy("DATE_FORMAT(payment.createdAt, '%Y-%m')")
      .getRawMany(),
    paymentRepo
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.refundedAt, '%Y-%m')", 'month')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('payment.refunded = 1')
      .andWhere('payment.refundedAt >= :start', { start: startDate })
      .groupBy("DATE_FORMAT(payment.refundedAt, '%Y-%m')")
      .getRawMany(),
    schoolRepo
      .createQueryBuilder('school')
      .select("DATE_FORMAT(school.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('school.createdAt >= :start', { start: startDate })
      .groupBy("DATE_FORMAT(school.createdAt, '%Y-%m')")
      .getRawMany(),
    studentRepo
      .createQueryBuilder('student')
      .select("DATE_FORMAT(student.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('student.createdAt >= :start', { start: startDate })
      .groupBy("DATE_FORMAT(student.createdAt, '%Y-%m')")
      .getRawMany(),
    teacherRepo
      .createQueryBuilder('teacher')
      .select("DATE_FORMAT(teacher.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('teacher.createdAt >= :start', { start: startDate })
      .groupBy("DATE_FORMAT(teacher.createdAt, '%Y-%m')")
      .getRawMany(),
    schoolRepo
      .createQueryBuilder('school')
      .where('school.createdAt < :start', { start: startDate })
      .getCount(),
    paymentRepo
      .createQueryBuilder('payment')
      .select('payment.schoolId', 'schoolId')
      .addSelect("DATE_FORMAT(payment.createdAt, '%Y-%m')", 'month')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
      .where("DATE_FORMAT(payment.createdAt, '%Y-%m') IN (:...periods)", {
        periods: [currentMonth, previousMonth],
      })
      .andWhere('(payment.refunded = 0 OR payment.refunded IS NULL)')
      .groupBy('payment.schoolId')
      .addGroupBy("DATE_FORMAT(payment.createdAt, '%Y-%m')")
      .getRawMany(),
  ]);

  const collectionsByMonth = monthMap(collectionsRows as Array<Record<string, unknown>>);
  const collectionCounts = monthMap(collectionsRows as Array<Record<string, unknown>>, 'count');
  const refundsByMonth = monthMap(refundRows as Array<Record<string, unknown>>);
  const schoolsByMonthCount = monthMap(schoolRows as Array<Record<string, unknown>>, 'count');
  const studentsByMonthCount = monthMap(studentRows as Array<Record<string, unknown>>, 'count');
  const teachersByMonthCount = monthMap(teacherRows as Array<Record<string, unknown>>, 'count');

  let cumulative = schoolsBeforeStart;
  const points: MonthlyPoint[] = months.map((month) => {
    const newSchools = schoolsByMonthCount.get(month) || 0;
    cumulative += newSchools;
    return {
      month,
      collections: Math.round((collectionsByMonth.get(month) || 0) * 100) / 100,
      paymentCount: collectionCounts.get(month) || 0,
      refundsAmount: Math.round((refundsByMonth.get(month) || 0) * 100) / 100,
      newSchools,
      cumulativeSchools: cumulative,
      newStudents: studentsByMonthCount.get(month) || 0,
      newTeachers: teachersByMonthCount.get(month) || 0,
    };
  });

  const at = (month: string) => points.find((p) => p.month === month);
  const cur = at(currentMonth);
  const prev = at(previousMonth);
  const last3 = points.slice(-3).reduce((sum, p) => sum + p.collections, 0);
  const previous3 = points.slice(0, 3).reduce((sum, p) => sum + p.collections, 0);

  const nameById = new Map(snapshot.schools.map((s) => [s.id, s.name]));
  const perSchoolMap = new Map<string, SchoolCollectionsComparison>();
  for (const school of snapshot.schools) {
    perSchoolMap.set(school.id, {
      schoolId: school.id,
      schoolName: school.name,
      currentMonth: 0,
      previousMonth: 0,
      delta: 0,
      deltaPct: 0,
    });
  }
  for (const row of perSchoolRows as Array<Record<string, unknown>>) {
    if (typeof row.schoolId !== 'string' || typeof row.month !== 'string') continue;
    const entry = perSchoolMap.get(row.schoolId) || {
      schoolId: row.schoolId,
      schoolName: nameById.get(row.schoolId) || row.schoolId,
      currentMonth: 0,
      previousMonth: 0,
      delta: 0,
      deltaPct: 0,
    };
    if (row.month === currentMonth) entry.currentMonth = Number(row.total) || 0;
    if (row.month === previousMonth) entry.previousMonth = Number(row.total) || 0;
    perSchoolMap.set(row.schoolId, entry);
  }
  const perSchoolCollections = [...perSchoolMap.values()]
    .map((entry) => ({
      ...entry,
      delta: Math.round((entry.currentMonth - entry.previousMonth) * 100) / 100,
      deltaPct: pctChange(entry.currentMonth, entry.previousMonth),
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 20);

  const currentVsPrevious = {
    collections: compareMetric(cur?.collections || 0, prev?.collections || 0),
    paymentCount: compareMetric(cur?.paymentCount || 0, prev?.paymentCount || 0),
    newSchools: compareMetric(cur?.newSchools || 0, prev?.newSchools || 0),
    newStudents: compareMetric(cur?.newStudents || 0, prev?.newStudents || 0),
  };

  const drivers = diagnoseCollections({
    collectionsCurrent: cur?.collections || 0,
    collectionsPrevious: prev?.collections || 0,
    paymentCountCurrent: cur?.paymentCount || 0,
    paymentCountPrevious: prev?.paymentCount || 0,
    refundsCurrent: cur?.refundsAmount || 0,
    refundsPrevious: prev?.refundsAmount || 0,
    perSchool: perSchoolCollections,
    newSchoolsCurrent: cur?.newSchools || 0,
    newSchoolsPrevious: prev?.newSchools || 0,
    frozenSchools: snapshot.totals.frozenSchools,
    inactiveSchools: snapshot.totals.inactiveSchools,
  });

  const churnRisks = buildChurnRisks(snapshot, now);

  const value: PlatformTrends = {
    generatedAt: new Date().toISOString(),
    months: points,
    currentVsPrevious,
    last3VsPrevious3Collections: compareMetric(
      Math.round(last3 * 100) / 100,
      Math.round(previous3 * 100) / 100,
    ),
    perSchoolCollections,
    drivers,
    churnRisks,
    planRecommendations: buildPlanRecommendations(snapshot),
    contactToday: buildContactToday(snapshot, churnRisks),
    limitations: LIMITATIONS,
  };

  trendsCache = { expiresAt: Date.now() + TRENDS_TTL_MS, value };
  return value;
}

export function clearPlatformTrendsCache(): void {
  trendsCache = null;
}
