import { Course } from './course.entity';
import { ApiError } from '../../shared/utils/ApiError';
import type { SchoolType } from '../../shared/interfaces';

export type CoursePaymentType = 'month' | 'course' | 'session';

/**
 * Resolves the single payment type a private-school course uses.
 * For legacy courses where multiple options are enabled, priority is:
 * course > month > session.
 */
export function resolveCoursePaymentType(course: Pick<Course, 'hasCourseOption' | 'hasMonthOption' | 'hasSessionOption'>): CoursePaymentType | null {
  if (course.hasCourseOption) return 'course';
  if (course.hasMonthOption) return 'month';
  if (course.hasSessionOption) return 'session';
  return null;
}

export function coursePaymentTypeLabel(type: CoursePaymentType): string {
  switch (type) {
    case 'course': return 'بالدورة';
    case 'month': return 'شهري';
    case 'session': return 'بالحصة';
    default: return '';
  }
}

/**
 * Validates course pricing configuration. Only enforced for private schools
 * where each course must define exactly ONE payment method together with the
 * data required by that method (start date for monthly, sessions count for
 * session-based, price for course-based).
 */
export function validateCoursePricing(schoolType: SchoolType | undefined, data: any): void {
  if (schoolType !== 'private') return;

  const options = [
    data.hasMonthOption === true,
    data.hasSessionOption === true,
    data.hasCourseOption === true,
  ].filter(Boolean).length;

  if (options === 0) {
    throw ApiError.badRequest('يجب اختيار طريقة دفع واحدة على الأقل للدورة (شهري / بالحصة / بالدورة)');
  }

  if (options > 1) {
    throw ApiError.badRequest('يمكن اختيار طريقة دفع واحدة فقط لكل دورة (شهري أو بالحصة أو بالدورة)');
  }

  if (data.hasMonthOption === true) {
    if (data.pricePerMonth === undefined || data.pricePerMonth === null || Number(data.pricePerMonth) <= 0) {
      throw ApiError.badRequest('يجب تحديد سعر الدفع الشهري للدورة');
    }
    if (!data.startDate) {
      throw ApiError.badRequest('يجب تحديد تاريخ بداية الدورة لحساب الأشهر');
    }
  }

  if (data.hasSessionOption === true) {
    if (data.pricePerSession === undefined || data.pricePerSession === null || Number(data.pricePerSession) <= 0) {
      throw ApiError.badRequest('يجب تحديد سعر الحصة الواحدة للدورة');
    }
    if (data.numberOfSessions === undefined || data.numberOfSessions === null || Number(data.numberOfSessions) <= 0) {
      throw ApiError.badRequest('يجب تحديد عدد حصص الدورة');
    }
  }

  if (data.hasCourseOption === true) {
    if (data.pricePerCourse === undefined || data.pricePerCourse === null || Number(data.pricePerCourse) <= 0) {
      throw ApiError.badRequest('يجب تحديد سعر الدورة كاملاً');
    }
  }
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function courseAlreadyStarted(course: Pick<Course, 'startDate'>): boolean {
  if (!course.startDate) return false;
  const start = new Date(course.startDate);
  if (isNaN(start.getTime())) return false;
  const startKey = course.startDate.slice(0, 10);
  return startKey < localDateKey(new Date());
}

/**
 * Once a course has started, its start date must not change because monthly
 * payment obligations are computed from it. Other fields stay editable.
 */
export function assertStartDateEditable(course: Pick<Course, 'startDate'>, data: any): void {
  if (data && 'startDate' in data && courseAlreadyStarted(course) && data.startDate !== course.startDate) {
    throw ApiError.badRequest('لا يمكن تغيير تاريخ بداية الدورة بعد بدايتها');
  }
}

/**
 * Returns the price to charge for the given payment type of a course.
 */
export function coursePriceForType(course: Course, type: CoursePaymentType): number {
  switch (type) {
    case 'course': return Number(course.pricePerCourse || 0);
    case 'month': return Number(course.pricePerMonth || 0);
    case 'session': return Number(course.pricePerSession || 0);
  }
}

export function toMonthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Enumerates the monthly keys a course spans from its start date up to the
 * current month (inclusive).
 */
export function courseRequiredMonths(course: Course, now: Date = new Date()): string[] {
  if (!course.startDate) return [];
  const start = new Date(course.startDate);
  const startKey = toMonthKey(start);
  const nowKey = toMonthKey(now);
  if (startKey > nowKey) return [];
  const [sy, sm] = startKey.split('-').map(Number);
  const [ny, nm] = nowKey.split('-').map(Number);
  const keys: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ny || (y === ny && m <= nm)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return keys;
}
