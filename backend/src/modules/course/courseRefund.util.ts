import { Course } from './course.entity';
import { Payment } from '../payment/payment.entity';
import { resolveCoursePaymentType, courseAlreadyStarted, CoursePaymentType } from './coursePricing.util';

export interface UnenrollRefundItem {
  paymentId?: string;
  label: string;
  amount: number;
}

export type UnenrollRefundMode = 'required' | 'adminDecision' | 'none';

export interface UnenrollRefundPreview {
  coursePaymentType: CoursePaymentType | null;
  mode: UnenrollRefundMode;
  refundAmount: number;
  items: UnenrollRefundItem[];
  completedSessionNumbers: number[];
}

/**
 * Computes what must / may be refunded when a student is removed from a
 * private-school course:
 * - Full-course ("دفع كامل"): the admin decides whether to refund.
 * - Monthly ("شهري"): if the course has not started yet the money must be
 *   refunded; once a month has started the admin decides.
 * - Per-session ("بالحصة"): only sessions NOT completed by the teacher are
 *   refunded — the money for them must be returned, because the student only
 *   owes for completed sessions.
 */
export function computeUnenrollRefund(
  course: Course,
  payments: Payment[],
  completedSessionNumbers: Set<number>,
): UnenrollRefundPreview {
  const type = resolveCoursePaymentType(course);
  const completed = Array.from(completedSessionNumbers);
  if (!type) {
    return { coursePaymentType: null, mode: 'none', refundAmount: 0, items: [], completedSessionNumbers: completed };
  }

  let items: UnenrollRefundItem[] = [];
  let mode: UnenrollRefundMode = 'none';
  const activePayments = payments.filter((p) => !p.refunded);

  if (type === 'course') {
    items = activePayments
      .filter((p) => p.paymentType === 'course')
      .map((p) => ({ paymentId: p.id, label: 'دفع كامل الدورة', amount: Number(p.amount) }));
    if (items.length > 0) mode = 'adminDecision';
  } else if (type === 'month') {
    items = activePayments
      .filter((p) => p.paymentType === 'month')
      .map((p) => ({ paymentId: p.id, label: `دفع شهر ${p.month || ''}`, amount: Number(p.amount) }));
    if (items.length > 0) {
      mode = courseAlreadyStarted(course) ? 'adminDecision' : 'required';
    }
  } else if (type === 'session') {
    items = activePayments
      .filter((p) => p.paymentType === 'session' && p.sessionNumber != null)
      .filter((p) => !completedSessionNumbers.has(Number(p.sessionNumber)))
      .map((p) => ({
        paymentId: p.id,
        label: `الحصة رقم ${p.sessionNumber} (لم تُكتمل بعد)`,
        amount: Number(p.amount),
      }));
    if (items.length > 0) mode = 'required';
  }

  const refundAmount = items.reduce((sum, i) => sum + Number(i.amount), 0);
  if (refundAmount <= 0) {
    return { coursePaymentType: type, mode: 'none', refundAmount: 0, items: [], completedSessionNumbers: completed };
  }
  return { coursePaymentType: type, mode, refundAmount, items, completedSessionNumbers: completed };
}
