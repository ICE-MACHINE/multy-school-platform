import { AppDataSource } from '../../config/data-source';
import { Payment } from '../payment/payment.entity';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { scopedWhere } from '../../shared/tenant/tenantScope';
import {
  computeFinancialIntelligence,
  type FinancialIntelligence,
  type MonthlyFinancePoint,
  type StudentArrears,
} from './financialIntelligence';

function monthKeysEnding(now: Date, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export class FinancialIntelligenceService {
  async getOverview(schoolId: string): Promise<FinancialIntelligence> {
    const schoolRepo = AppDataSource.getRepository(School);
    const studentRepo = AppDataSource.getRepository(Student);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const school = await schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw ApiError.notFound('School not found');
    const monthlyFee = Number(school.monthlyFee) || 0;

    const now = new Date();
    const months = monthKeysEnding(now, 6);
    const startDate = `${months[0]}-01`;

    const [payingStudents, exemptStudents, collectionRows, refundRows, activeStudents, monthlyPayments] =
      await Promise.all([
        studentRepo.count({ where: scopedWhere(schoolId, { isActive: true, isExemptFromPayment: false }) }),
        studentRepo.count({ where: scopedWhere(schoolId, { isActive: true, isExemptFromPayment: true }) }),
        paymentRepo
          .createQueryBuilder('payment')
          .select("DATE_FORMAT(payment.createdAt, '%Y-%m')", 'month')
          .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
          .addSelect('COUNT(*)', 'count')
          .where('payment.schoolId = :schoolId', { schoolId })
          .andWhere('payment.createdAt >= :start', { start: startDate })
          .andWhere('(payment.refunded = 0 OR payment.refunded IS NULL)')
          .groupBy("DATE_FORMAT(payment.createdAt, '%Y-%m')")
          .getRawMany(),
        paymentRepo
          .createQueryBuilder('payment')
          .select("DATE_FORMAT(payment.refundedAt, '%Y-%m')", 'month')
          .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
          .where('payment.schoolId = :schoolId', { schoolId })
          .andWhere('payment.refunded = 1')
          .andWhere('payment.refundedAt >= :start', { start: startDate })
          .groupBy("DATE_FORMAT(payment.refundedAt, '%Y-%m')")
          .getRawMany(),
        studentRepo.find({
          where: scopedWhere(schoolId, { isActive: true, isExemptFromPayment: false }),
          select: ['id', 'firstName', 'lastName', 'createdAt'],
        }),
        paymentRepo.find({
          where: scopedWhere(schoolId),
          select: ['studentId', 'month', 'paymentDate', 'paymentType'],
        }),
      ]);

    const collectedByMonth = new Map<string, { total: number; count: number }>();
    for (const row of collectionRows as Array<Record<string, unknown>>) {
      if (typeof row.month === 'string') {
        collectedByMonth.set(row.month, { total: Number(row.total) || 0, count: Number(row.count) || 0 });
      }
    }
    const refundsByMonth = new Map<string, number>();
    for (const row of refundRows as Array<Record<string, unknown>>) {
      if (typeof row.month === 'string') refundsByMonth.set(row.month, Number(row.total) || 0);
    }
    const points: MonthlyFinancePoint[] = months.map((month) => ({
      month,
      collected: Math.round((collectedByMonth.get(month)?.total || 0) * 100) / 100,
      paymentCount: collectedByMonth.get(month)?.count || 0,
      refundsAmount: Math.round((refundsByMonth.get(month) || 0) * 100) / 100,
    }));

    const currentMonth = months[months.length - 1];
    const [currentYear] = currentMonth.split('-').map(Number);
    const dueMonths: string[] = [];
    for (let m = 1; m <= Number(currentMonth.split('-')[1]); m++) {
      dueMonths.push(`${currentYear}-${String(m).padStart(2, '0')}`);
    }

    const paymentsByStudent = new Map<string, Array<{ month: string | null; paymentDate: string }>>();
    for (const p of monthlyPayments) {
      if (!p.studentId || p.paymentType !== 'month' && !p.month) continue;
      const list = paymentsByStudent.get(p.studentId) || [];
      list.push({ month: p.month, paymentDate: String(p.paymentDate) });
      paymentsByStudent.set(p.studentId, list);
    }

    const studentArrears: StudentArrears[] = [];
    if (monthlyFee > 0) {
      for (const student of activeStudents) {
        const enrolledMonth = new Date(student.createdAt).toISOString().slice(0, 7);
        const due = dueMonths.filter((m) => m >= enrolledMonth);
        const studentPayments = paymentsByStudent.get(student.id) || [];
        const paidMonths = new Set(studentPayments.map((p) => p.month).filter(Boolean));
        const unpaidMonths = due.filter((m) => !paidMonths.has(m));
        if (unpaidMonths.length === 0) continue;
        const latePaymentsCount = studentPayments.filter(
          (p) => p.month && String(p.paymentDate).slice(0, 7) > p.month,
        ).length;
        studentArrears.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          unpaidMonths,
          arrearsAmount: Math.round(unpaidMonths.length * monthlyFee * 100) / 100,
          latePaymentsCount,
        });
      }
    }

    return computeFinancialIntelligence({
      monthlyFee,
      payingStudents,
      exemptStudents,
      months: points,
      studentArrears,
    });
  }
}

export const financialIntelligenceService = new FinancialIntelligenceService();
