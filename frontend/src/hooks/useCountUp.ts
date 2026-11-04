import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';

interface CountUpOptions {
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  start?: boolean;
}

export function useCountUp(target: number, { duration = 1600, delay = 0, format, start = false }: CountUpOptions = {}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    if (!start) return;
    if (!inView) {
      const value = formatRef.current ? formatRef.current(target) : target.toLocaleString('en-US');
      setDisplay(value);
      return;
    }
    const controls = animate(0, target, {
      duration: duration / 1000,
      delay: delay / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const n = Math.round(v);
        setDisplay(formatRef.current ? formatRef.current(n) : n.toLocaleString('en-US'));
      },
    });
    return () => controls.stop();
  }, [start, inView, target, duration, delay]);

  return { ref, display };
}
