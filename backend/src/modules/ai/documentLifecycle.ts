import type { DocumentReviewStatus } from './documentScan.entity';

export type DocumentLifecycleStatus = DocumentReviewStatus;

export const REVIEW_WINDOW_DAYS_AFTER_COVERAGE = 30;
export const REVIEW_WINDOW_DAYS_WITHOUT_DATES = 90;

const ALLOWED_TRANSITIONS: Record<DocumentLifecycleStatus, DocumentLifecycleStatus[]> = {
  pending_review: ['confirmed', 'approved', 'rejected', 'expired'],
  confirmed: ['approved', 'rejected', 'expired'],
  approved: ['archived'],
  rejected: ['archived'],
  expired: ['archived'],
  archived: [],
};

export function canTransition(from: DocumentLifecycleStatus, to: DocumentLifecycleStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isFinalLifecycleStatus(status: DocumentLifecycleStatus): boolean {
  return status === 'approved' || status === 'rejected' || status === 'archived';
}

export function isActionableLifecycleStatus(status: DocumentLifecycleStatus): boolean {
  return status === 'pending_review' || status === 'confirmed';
}

export function dateRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function computeReviewExpiry(input: {
  createdAt: Date | string;
  startDate?: string | null;
  endDate?: string | null;
}): Date {
  const coverageEnd = input.endDate || input.startDate;
  if (coverageEnd && /^\d{4}-\d{2}-\d{2}$/.test(coverageEnd)) {
    return addDays(new Date(`${coverageEnd}T23:59:59.999Z`), REVIEW_WINDOW_DAYS_AFTER_COVERAGE);
  }
  return addDays(new Date(input.createdAt), REVIEW_WINDOW_DAYS_WITHOUT_DATES);
}

export function shouldExpire(
  status: DocumentLifecycleStatus,
  expiry: Date,
  now: Date = new Date(),
): boolean {
  return isActionableLifecycleStatus(status) && now.getTime() > expiry.getTime();
}

export interface CoverageRange {
  startDate: string;
  endDate: string;
}

export function findOverlappingCoverage<T extends { id: string } & CoverageRange>(
  target: CoverageRange,
  others: T[],
): T[] {
  return others.filter((other) =>
    dateRangesOverlap(target.startDate, target.endDate, other.startDate, other.endDate),
  );
}
