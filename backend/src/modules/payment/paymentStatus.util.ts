export type PaymentStatus = 'exempt' | 'overdue' | 'due' | 'upcoming' | 'paid';

export interface ExemptionPeriodLike {
  startDate: Date | string;
  endDate?: Date | string | null;
}

interface StatusInput {
  id: string;
  isExemptFromPayment?: boolean;
  createdAt?: Date | string;
}

function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function isMonthExempted(monthKey: string, periods: ExemptionPeriodLike[] | undefined): boolean {
  if (!periods || periods.length === 0) return false;
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return false;
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
  return periods.some((p) => {
    const s = new Date(p.startDate);
    if (isNaN(s.getTime())) return false;
    if (s.getTime() > monthEnd.getTime()) return false;
    const e = p.endDate ? new Date(p.endDate) : null;
    if (e && !isNaN(e.getTime()) && e.getTime() < monthStart.getTime()) return false;
    return true;
  });
}

export function computePaymentStatus(
  student: StatusInput,
  paidMonths: Set<string>,
  now: Date = new Date(),
  exemptionPeriods?: ExemptionPeriodLike[],
): PaymentStatus {
  if (student.isExemptFromPayment) return 'exempt';

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentMonth = toMonthKey(year, month);

  if (isMonthExempted(currentMonth, exemptionPeriods)) return 'exempt';

  const reg = student.createdAt ? new Date(student.createdAt) : now;
  let cy = reg.getFullYear();
  let cm = reg.getMonth() + 1;

  while (cy < year || (cy === year && cm < month)) {
    const key = toMonthKey(cy, cm);
    if (!paidMonths.has(key) && !isMonthExempted(key, exemptionPeriods)) return 'overdue';
    cm++;
    if (cm > 12) {
      cm = 1;
      cy++;
    }
  }

  if (paidMonths.has(currentMonth)) {
    const lastDay = new Date(year, month, 0).getDate();
    const daysUntilNextMonth = lastDay - now.getDate() + 1;
    return daysUntilNextMonth <= 10 ? 'upcoming' : 'paid';
  }

  return 'due';
}

export function computePaymentStatusMap(
  students: StatusInput[],
  paidMap: Map<string, Set<string>>,
  now: Date = new Date(),
  exemptionMap: Map<string, ExemptionPeriodLike[]> = new Map(),
): Map<string, PaymentStatus> {
  const map = new Map<string, PaymentStatus>();
  for (const s of students) {
    map.set(s.id, computePaymentStatus(s, paidMap.get(s.id) || new Set(), now, exemptionMap.get(s.id)));
  }
  return map;
}

interface CourseLike {
  id: string;
  hasCourseOption: boolean;
  hasMonthOption: boolean;
  hasSessionOption: boolean;
  startDate?: string | null;
  numberOfSessions?: number | null;
  pricePerMonth?: number | null;
  pricePerSession?: number | null;
  pricePerCourse?: number | null;
}

interface PrivateStatusInput {
  id: string;
  isExemptFromPayment?: boolean;
  enrolledCourses?: CourseLike[];
}

interface CoursePaymentLike {
  courseId?: string | null;
  paymentType?: 'month' | 'course' | 'session' | null;
  month?: string | null;
  sessionNumber?: number | null;
  refunded?: boolean;
}

function resolveCourseType(course: CourseLike): 'month' | 'course' | 'session' | null {
  if (course.hasCourseOption) return 'course';
  if (course.hasMonthOption) return 'month';
  if (course.hasSessionOption) return 'session';
  return null;
}

function courseRequiredMonthsForStatus(course: CourseLike, now: Date): string[] {
  if (!course.startDate) return [];
  const start = new Date(course.startDate);
  if (isNaN(start.getTime())) return [];
  const startKey = toMonthKey(start.getFullYear(), start.getMonth() + 1);
  const nowKey = toMonthKey(now.getFullYear(), now.getMonth() + 1);
  if (startKey > nowKey) return [];
  const keys: string[] = [];
  let y = start.getFullYear();
  let m = start.getMonth() + 1;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    keys.push(toMonthKey(y, m));
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return keys;
}

/**
 * Private schools: payment is tied to each enrolled course. A student with no
 * courses owes nothing. For every enrolled course the relevant option
 * (full course / monthly since start date / all sessions) must be paid.
 * For session-based courses only teacher-completed sessions are owed.
 */
export function computePrivatePaymentStatusMap(
  students: PrivateStatusInput[],
  paymentsMap: Map<string, CoursePaymentLike[]>,
  now: Date = new Date(),
  completedSessionsMap: Map<string, Set<number>> = new Map(),
): Map<string, PaymentStatus> {
  const map = new Map<string, PaymentStatus>();
  for (const s of students) {
    if (s.isExemptFromPayment) {
      map.set(s.id, 'exempt');
      continue;
    }
    const courses = s.enrolledCourses || [];
    if (courses.length === 0) {
      map.set(s.id, 'paid');
      continue;
    }
    const payments = paymentsMap.get(s.id) || [];
    let due = false;
    for (const course of courses) {
      const type = resolveCourseType(course);
      if (!type) continue;
      const coursePayments = payments.filter((p) => p.courseId === course.id && !p.refunded);
      if (type === 'course') {
        if (!coursePayments.some((p) => p.paymentType === 'course')) due = true;
      } else if (type === 'month') {
        const required = courseRequiredMonthsForStatus(course, now);
        if (required.length === 0) continue;
        const paidSet = new Set(
          coursePayments.filter((p) => p.paymentType === 'month' && p.month).map((p) => p.month),
        );
        if (!required.every((m) => paidSet.has(m))) due = true;
      } else {
        const totalSessions = Number(course.numberOfSessions || 0);
        if (totalSessions <= 0) continue;
        const paidSet = new Set(
          coursePayments
            .filter((p) => p.paymentType === 'session' && p.sessionNumber != null)
            .map((p) => Number(p.sessionNumber)),
        );
        const completed = completedSessionsMap.get(course.id) || new Set<number>();
        if (completed.size === 0) continue;
        for (const n of completed) {
          if (!paidSet.has(n)) {
            due = true;
            break;
          }
        }
      }
    }
    map.set(s.id, due ? 'due' : 'paid');
  }
  return map;
}
