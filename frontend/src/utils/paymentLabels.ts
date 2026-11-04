import type { TFunction } from 'i18next';
import i18n from '../i18n';
import { formatMonthKey } from './arabicMonths';
import type { Payment } from '../types';

export function paymentPeriodLabel(r: Payment, t?: TFunction): string {
  const translate: TFunction = t ?? ((i18n.t.bind(i18n) as unknown) as TFunction);
  if (r.paymentType === 'session' && r.courseName) return translate('payments.sessionPeriod', { course: r.courseName, session: r.sessionNumber });
  if (r.paymentType === 'course' && r.courseName) return translate('payments.fullCoursePeriod', { course: r.courseName });
  if (r.paymentType === 'month' && r.month && r.courseName) return `${r.courseName} — ${formatMonthKey(r.month)}`;
  if (r.paymentType === 'month' && r.month) return formatMonthKey(r.month);
  if (r.month) return formatMonthKey(r.month);
  return r.sessionDate || r.courseName || translate('common.notAvailable');
}
