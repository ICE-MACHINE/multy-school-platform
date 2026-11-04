export const easings = {
  spring: [0.16, 1, 0.3, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  standard: [0.4, 0, 0.2, 1],
} as const;

export const durations = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

export const inputTransition = {
  type: 'tween' as const,
  duration: durations.fast / 1000,
  ease: easings.spring,
};

export const popoverTransition = {
  enter: {
    type: 'tween' as const,
    duration: durations.normal / 1000,
    ease: easings.spring,
  },
  exit: {
    type: 'tween' as const,
    duration: durations.instant / 1000,
    ease: easings.accelerate,
  },
};

export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 24,
  mass: 0.8,
};

export const fadeSlideVariants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -2 },
};

export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export function getPopoverOrigin(triggerRect: DOMRect | null, popoverRect: DOMRect | null) {
  if (!triggerRect || !popoverRect) return { originX: 0.5, originY: 0.5 };

  const _triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  const originX = Math.min(1, Math.max(0, (_triggerCenterX - popoverRect.left) / popoverRect.width));
  const originY = Math.min(1, Math.max(0, (triggerCenterY - popoverRect.top) / popoverRect.height));

  return { originX, originY };
}
