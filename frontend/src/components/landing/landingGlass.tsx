import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { easings, durations } from '../../theme/motion';

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface GlassOptions {
  blur?: number;
  radius?: number;
  interactive?: boolean;
}

export function glassSx(isDark: boolean, accent: string, { blur = 22, radius = 3, interactive = false }: GlassOptions = {}) {
  return {
    position: 'relative',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
    backdropFilter: `blur(${blur}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)'}`,
    borderRadius: radius,
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.09), 0 16px 44px rgba(0,0,0,0.4)'
      : `inset 0 1px 0 rgba(255,255,255,0.85), 0 16px 44px ${hexToRgba(accent, 0.18)}`,
    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    ...(interactive
      ? {
          '&:hover': {
            transform: 'translateY(-6px)',
            borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.95)',
            boxShadow: isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.5)'
              : `inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px ${hexToRgba(accent, 0.26)}`,
          },
        }
      : {}),
  } as const;
}

export const fluidStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
};

export const fluidItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow / 1000, ease: easings.spring },
  },
};

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  once?: boolean;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 24, x = 0, once = true, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ delay, duration: durations.slow / 1000, ease: easings.spring }}
    >
      {children}
    </motion.div>
  );
}

interface AmbientBlobsProps {
  colors: string[];
  className?: string;
}

export function AmbientBlobs({ colors, className }: AmbientBlobsProps) {
  return (
    <Box className={className} sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
      {colors.map((color, i) => {
        const variants = [
          { top: '-12%', left: '-8%', size: 340 },
          { top: '30%', right: '-10%', size: 300 },
          { bottom: '-18%', left: '30%', size: 380 },
          { top: '50%', left: '45%', size: 260 },
        ];
        const p = variants[i % variants.length];
        return (
          <motion.div
            key={i}
            animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 7 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
            style={{
              position: 'absolute',
              top: p.top,
              left: p.left,
              right: p.right,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              filter: 'blur(26px)',
              opacity: 0.5,
            }}
          />
        );
      })}
    </Box>
  );
}
