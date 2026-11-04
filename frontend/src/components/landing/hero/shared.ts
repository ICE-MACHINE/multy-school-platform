import { useNavigate } from 'react-router-dom';
import type { TargetAndTransition, Variants } from 'framer-motion';
import { easings, durations } from '../../../theme/motion';
import type { SchoolTypeConfig } from '../landingTypes';

export interface HeroProps {
  config: SchoolTypeConfig;
  schoolName?: string;
  schoolPhone?: string;
  schoolId?: string;
  isRoot?: boolean;
}

export const floatVariants: Record<'float1' | 'float2' | 'float3', TargetAndTransition> = {
  float1: {
    y: [0, -15, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  float2: {
    y: [0, -10, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
  float3: {
    y: [0, -20, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

export const childVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow / 1000, ease: easings.spring },
  },
};

export function useNavigateSafely() {
  try {
    return useNavigate();
  } catch {
    return (_path: string) => {};
  }
}
