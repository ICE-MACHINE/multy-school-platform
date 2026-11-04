export const glassBlur = {
  sm: '10px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const glassTokens = {
  light: {
    fillSubtle: 'rgba(255,255,255,0.38)',
    fill: 'rgba(255,255,255,0.58)',
    fillStrong: 'rgba(255,255,255,0.84)',
    border: 'rgba(255,255,255,0.72)',
    hairline: 'rgba(16,24,40,0.09)',
    highlight: 'inset 0 1px 0 rgba(255,255,255,0.9)',
    shadow:
      'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(16,24,40,0.05), 0 8px 24px -12px rgba(16,24,40,0.16)',
    shadowHover:
      'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 4px rgba(16,24,40,0.06), 0 20px 44px -16px rgba(15,98,254,0.24)',
    saturation: 'saturate(180%)',
  },
  dark: {
    fillSubtle: 'rgba(22,22,28,0.36)',
    fill: 'rgba(22,22,28,0.52)',
    fillStrong: 'rgba(22,22,28,0.8)',
    border: 'rgba(255,255,255,0.14)',
    hairline: 'rgba(255,255,255,0.09)',
    highlight: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    shadow:
      'inset 0 1px 0 rgba(255,255,255,0.09), 0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -12px rgba(0,0,0,0.55)',
    shadowHover:
      'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.45), 0 24px 48px -16px rgba(0,0,0,0.65)',
    saturation: 'saturate(160%)',
  },
} as const;

export type GlassMode = keyof typeof glassTokens;
export type GlassStrength = 'subtle' | 'default' | 'strong';

export function getGlass(mode: GlassMode) {
  return glassTokens[mode];
}

export interface GlassSurfaceStyle {
  backgroundColor: string;
  backdropFilter: string;
  WebkitBackdropFilter: string;
  border: string;
  boxShadow: string;
}

export function glassSurface(mode: GlassMode, strength: GlassStrength = 'default', blur: number = 24): GlassSurfaceStyle {
  const t = glassTokens[mode];
  const fill = strength === 'subtle' ? t.fillSubtle : strength === 'strong' ? t.fillStrong : t.fill;
  const filter = `blur(${blur}px) ${t.saturation}`;
  return {
    backgroundColor: fill,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.border}`,
    boxShadow: t.highlight,
  };
}

export function ambientBackground(mode: GlassMode): string {
  return mode === 'dark'
    ? 'radial-gradient(1100px 700px at 88% -8%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(900px 650px at -8% 28%, rgba(14,165,233,0.15), transparent 55%), radial-gradient(1000px 800px at 108% 92%, rgba(16,185,129,0.12), transparent 55%), radial-gradient(800px 620px at 50% 118%, rgba(168,85,247,0.14), transparent 60%), #0b0c12'
    : 'radial-gradient(1100px 700px at 88% -8%, rgba(99,102,241,0.16), transparent 55%), radial-gradient(900px 650px at -8% 28%, rgba(14,165,233,0.13), transparent 55%), radial-gradient(1000px 800px at 108% 92%, rgba(16,185,129,0.11), transparent 55%), radial-gradient(800px 620px at 50% 118%, rgba(168,85,247,0.1), transparent 60%), #eef1f8';
}
