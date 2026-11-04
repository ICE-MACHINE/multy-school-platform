import type { SchoolTypeConfig } from './landingTypes';

export type LandingVariant = 'quranic' | 'private' | 'kindergarten';
export type ThemeMode = 'light' | 'dark';

export interface LandingColors {
  pageBg: string;
  sectionBg: string;
  sectionBgAlt: string;
  footerBg: string;
  textPrimary: string;
  textSecondary: string;
  headingAccent: string;
  cardBg: string;
  cardBorder: string;
  navbarBg: string;
  navbarBorder: string;
  statCardBg: string;
  statBorder: string;
  testimonialBg: string;
}

const palette: Record<LandingVariant, Record<ThemeMode, LandingColors>> = {
  quranic: {
    dark: {
      pageBg: '#0f172a',
      sectionBg: '#0d0500',
      sectionBgAlt: '#1a0a00',
      footerBg: '#080200',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      headingAccent: '#fbbf24',
      cardBg: 'rgba(245,158,11,0.03)',
      cardBorder: 'rgba(245,158,11,0.08)',
      navbarBg: 'rgba(26,10,0,0.9)',
      navbarBorder: 'rgba(245,158,11,0.2)',
      statCardBg: 'rgba(30,15,0,0.95)',
      statBorder: 'rgba(245,158,11,0.15)',
      testimonialBg: 'rgba(30,15,0,0.6)',
    },
    light: {
      pageBg: '#fff7ed',
      sectionBg: '#fffbeb',
      sectionBgAlt: '#fff7ed',
      footerBg: '#fffbeb',
      textPrimary: '#451a03',
      textSecondary: 'rgba(69,26,3,0.65)',
      headingAccent: '#92400e',
      cardBg: 'rgba(255,255,255,0.8)',
      cardBorder: 'rgba(245,158,11,0.18)',
      navbarBg: 'rgba(255,247,237,0.85)',
      navbarBorder: 'rgba(245,158,11,0.25)',
      statCardBg: 'rgba(255,255,255,0.9)',
      statBorder: 'rgba(245,158,11,0.3)',
      testimonialBg: 'rgba(255,255,255,0.85)',
    },
  },
  private: {
    dark: {
      pageBg: '#0f172a',
      sectionBg: '#0f0d2e',
      sectionBgAlt: '#1e1b4b',
      footerBg: '#0a0920',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      headingAccent: '#ffffff',
      cardBg: 'rgba(30,27,75,0.6)',
      cardBorder: 'rgba(99,102,241,0.1)',
      navbarBg: 'rgba(30,27,75,0.9)',
      navbarBorder: 'rgba(99,102,241,0.2)',
      statCardBg: 'rgba(30,27,75,0.95)',
      statBorder: 'rgba(99,102,241,0.15)',
      testimonialBg: 'rgba(30,27,75,0.6)',
    },
    light: {
      pageBg: '#eef2ff',
      sectionBg: '#f5f7ff',
      sectionBgAlt: '#e0e7ff',
      footerBg: '#eef2ff',
      textPrimary: '#1e1b4b',
      textSecondary: 'rgba(30,27,75,0.65)',
      headingAccent: '#312e81',
      cardBg: 'rgba(255,255,255,0.8)',
      cardBorder: 'rgba(99,102,241,0.18)',
      navbarBg: 'rgba(238,242,255,0.85)',
      navbarBorder: 'rgba(99,102,241,0.25)',
      statCardBg: 'rgba(255,255,255,0.9)',
      statBorder: 'rgba(99,102,241,0.3)',
      testimonialBg: 'rgba(255,255,255,0.85)',
    },
  },
  kindergarten: {
    dark: {
      pageBg: '#0f172a',
      sectionBg: '#01140f',
      sectionBgAlt: '#022c22',
      footerBg: '#011009',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      headingAccent: '#fde68a',
      cardBg: 'rgba(6,95,70,0.3)',
      cardBorder: 'rgba(16,185,129,0.1)',
      navbarBg: 'rgba(2,44,34,0.9)',
      navbarBorder: 'rgba(16,185,129,0.2)',
      statCardBg: 'rgba(2,44,34,0.95)',
      statBorder: 'rgba(16,185,129,0.15)',
      testimonialBg: 'rgba(6,95,70,0.3)',
    },
    light: {
      pageBg: '#ecfdf5',
      sectionBg: '#f0fdf4',
      sectionBgAlt: '#d1fae5',
      footerBg: '#ecfdf5',
      textPrimary: '#064e3b',
      textSecondary: 'rgba(6,78,59,0.65)',
      headingAccent: '#047857',
      cardBg: 'rgba(255,255,255,0.8)',
      cardBorder: 'rgba(16,185,129,0.2)',
      navbarBg: 'rgba(236,253,245,0.85)',
      navbarBorder: 'rgba(16,185,129,0.25)',
      statCardBg: 'rgba(255,255,255,0.9)',
      statBorder: 'rgba(16,185,129,0.3)',
      testimonialBg: 'rgba(255,255,255,0.85)',
    },
  },
};

export const getLandingColors = (
  variant: LandingVariant,
  mode: ThemeMode
): LandingColors => palette[variant][mode];

export const heroGradient = (
  config: SchoolTypeConfig,
  isDark: boolean
): string => (isDark ? config.gradient : config.gradientLight);

export const ctaGradient = (
  config: SchoolTypeConfig,
  isDark: boolean
): string => {
  if (!isDark) {
    return config.gradientLight;
  }
  if (config.id === 'quranic') {
    return 'linear-gradient(135deg, #0d0500 0%, #3d1f00 50%, #7a4a00 100%)';
  }
  if (config.id === 'kindergarten') {
    return 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)';
  }
  return config.gradient;
};
