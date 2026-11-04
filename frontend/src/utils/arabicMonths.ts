import i18n from '../i18n';

export const ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const MONTH_KEYS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

function monthName(idx: number, lng?: string): string {
  const lang = lng || i18n.resolvedLanguage || i18n.language || 'en';
  try {
    return new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2024, idx, 1));
  } catch {
    return ARABIC_MONTHS[idx] ?? String(idx + 1);
  }
}

export function formatMonthLabel(mm: string, lng?: string): string {
  const idx = Number(mm) - 1;
  if (idx < 0 || idx > 11) return mm;
  return monthName(idx, lng);
}

export function formatMonthKey(monthKey: string, lng?: string): string {
  const [year, mm] = monthKey.split('-');
  if (!year || !mm) return monthKey;
  return `${formatMonthLabel(mm, lng)} ${year}`;
}
