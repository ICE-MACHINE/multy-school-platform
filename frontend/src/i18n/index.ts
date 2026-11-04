import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_STORAGE_KEY = 'app-language';

export function isRtlLanguage(lng: string): boolean {
  return lng.startsWith('ar');
}

export function applyDocumentLanguage(lng: string): void {
  const lang = SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage) ? lng : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    supportedLngs: [...SUPPORTED_LANGUAGES],
    fallbackLng: 'en',
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

applyDocumentLanguage(i18n.resolvedLanguage || i18n.language || 'en');
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
