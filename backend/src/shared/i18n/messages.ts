import type { Request } from 'express';

export const SUPPORTED_LOCALES = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const messages = {
  en: {
    notFound: 'Route not found',
    internalError: 'Internal server error',
    noToken: 'No access token provided',
    invalidToken: 'Invalid or expired token',
    refreshRequired: 'Refresh token is required',
    invalidRefresh: 'Invalid or expired refresh token',
    tooManyRequests: 'Too many requests, please try again later',
  },
  fr: {
    notFound: 'Route introuvable',
    internalError: 'Erreur interne du serveur',
    noToken: "Aucun jeton d'accès fourni",
    invalidToken: 'Jeton invalide ou expiré',
    refreshRequired: 'Le jeton de rafraîchissement est requis',
    invalidRefresh: 'Jeton de rafraîchissement invalide ou expiré',
    tooManyRequests: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  ar: {
    notFound: 'المسار غير موجود',
    internalError: 'خطأ داخلي في الخادم',
    noToken: 'لم يتم تقديم رمز الدخول',
    invalidToken: 'الرمز غير صالح أو منتهي الصلاحية',
    refreshRequired: 'رمز التحديث مطلوب',
    invalidRefresh: 'رمز التحديث غير صالح أو منتهي الصلاحية',
    tooManyRequests: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
  },
} as const;

export type MessageKey = keyof (typeof messages)['en'];

export function resolveLocale(req: Request): Locale {
  const header = req.headers['accept-language'];
  if (!header) return 'en';
  for (const part of header.split(',')) {
    const tag = part.trim().split(';')[0].slice(0, 2).toLowerCase();
    if ((SUPPORTED_LOCALES as readonly string[]).includes(tag)) return tag as Locale;
  }
  return 'en';
}

export function t(req: Request, key: MessageKey): string {
  return messages[resolveLocale(req)][key];
}
