export const carbonSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const carbonColors = {
  blue50: '#4589ff',
  blue60: '#0f62fe',
  blue70: '#0043ce',
  blue80: '#002d9c',
  gray05: '#f8fafc',
  gray10: '#f4f4f4',
  gray20: '#e0e0e0',
  gray30: '#c6c6c6',
  gray40: '#a8a8a8',
  gray50: '#8d8d8d',
  gray60: '#6f6f6f',
  gray70: '#525252',
  gray80: '#393939',
  gray90: '#262626',
  gray100: '#161616',
  teal50: '#009d9a',
  teal60: '#007d79',
  green50: '#24a148',
  red60: '#da1e28',
  yellow30: '#f1c21b',
  orange40: '#ff832b',
  purple60: '#8a3ffc',
  cyan50: '#1192e8',
} as const;

export const carbonRadii = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const carbonShadows = {
  light: {
    sm: '0 1px 2px rgba(16, 24, 40, 0.05), 0 1px 3px rgba(16, 24, 40, 0.06)',
    md: '0 1px 2px rgba(16, 24, 40, 0.05), 0 8px 24px -12px rgba(16, 24, 40, 0.18)',
    lg: '0 2px 4px rgba(16, 24, 40, 0.06), 0 20px 44px -16px rgba(16, 24, 40, 0.24)',
  },
  dark: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.35)',
    md: '0 1px 2px rgba(0, 0, 0, 0.4), 0 12px 32px -12px rgba(0, 0, 0, 0.55)',
    lg: '0 2px 6px rgba(0, 0, 0, 0.45), 0 24px 48px -16px rgba(0, 0, 0, 0.65)',
  },
} as const;

export const carbonFocusRing = {
  light: '0 0 0 3px rgba(15, 98, 254, 0.18)',
  dark: '0 0 0 3px rgba(120, 169, 255, 0.24)',
} as const;
