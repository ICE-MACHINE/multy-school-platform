import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { popoverTransition, springTransition, getPopoverOrigin } from '../../theme/motion';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  placement?: 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';
  offset?: number;
  sameWidth?: boolean;
  className?: string;
}

export default function Popover({
  open,
  onClose,
  triggerRef,
  children,
  placement = 'bottom-start',
  offset = 8,
  sameWidth = false,
  className,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [origin, setOrigin] = useState({ originX: 0.5, originY: 0.5 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverEl = popoverRef.current;
    let popoverRect: DOMRect | null = null;

    if (popoverEl) {
      popoverRect = popoverEl.getBoundingClientRect();
    } else {
      popoverRect = { width: sameWidth ? triggerRect.width : 200, height: 0 } as DOMRect;
    }

    const popoverWidth = sameWidth ? triggerRect.width : popoverRect.width;

    let top = 0;
    let left = 0;

    if (placement.startsWith('bottom')) {
      top = triggerRect.bottom + offset;
    } else {
      top = triggerRect.top - (popoverRect.height || 0) - offset;
    }

    if (placement === 'bottom-start' || placement === 'top-start') {
      left = triggerRect.left;
    } else if (placement === 'bottom-end' || placement === 'top-end') {
      left = triggerRect.right - popoverWidth;
    } else {
      left = triggerRect.left + (triggerRect.width - popoverWidth) / 2;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    left = Math.max(8, Math.min(left, viewportWidth - popoverWidth - 8));

    if (placement.startsWith('bottom')) {
      top = Math.min(top, viewportHeight - 8);
    } else {
      top = Math.max(8, top);
    }

    setStyle({
      position: 'fixed',
      top,
      left,
      width: sameWidth ? triggerRect.width : undefined,
      zIndex: 1300,
    });

    if (popoverEl) {
      const newRect = popoverEl.getBoundingClientRect();
      setOrigin(getPopoverOrigin(triggerRect, newRect));
    }
  }, [triggerRef, placement, offset, sameWidth]);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose, triggerRef]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          key="popover"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            ...springTransition,
            opacity: popoverTransition.enter,
          }}
          style={{
            ...style,
            transformOrigin: `${origin.originX * 100}% ${origin.originY * 100}%`,
          }}
          className={className}
          onAnimationComplete={updatePosition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
