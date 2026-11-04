import { useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import Popover from './Popover';
import { easings, durations } from '../../theme/motion';
import { getGlass } from '../../theme/glass';

interface DropdownMenuItemProps {
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export function DropdownMenuItem({ onClick, children, icon, disabled, danger }: DropdownMenuItemProps) {
  const theme = useTheme();
  return (
    <motion.button
      whileHover={{ backgroundColor: danger ? 'rgba(239, 68, 68, 0.08)' : alpha(theme.palette.primary.main, 0.08), x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: durations.fast / 1000, ease: easings.spring }}
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        borderRadius: 8,
        fontSize: 14,
        color: danger ? '#ef4444' : 'inherit',
        textAlign: 'right',
        fontFamily: 'inherit',
      }}
    >
      {icon && <span style={{ display: 'flex', fontSize: 18 }}>{icon}</span>}
      {children}
    </motion.button>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  const theme = useTheme();
  return (
    <div
      className={className}
      style={{
        height: 1,
        margin: '4px 8px',
        backgroundColor: theme.palette.divider,
      }}
    />
  );
}

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  triggerProps?: Record<string, unknown>;
  children: ReactNode;
  placement?: 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';
  sameWidth?: boolean;
}

export default function DropdownMenu({
  open,
  onClose,
  trigger,
  children,
  placement = 'bottom-start',
  sameWidth = false,
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light';
  const glass = getGlass(mode);

  return (
    <>
      <div ref={triggerRef} style={{ display: 'inline-flex' }}>
        {trigger}
      </div>
      <Popover
        open={open}
        onClose={onClose}
        triggerRef={triggerRef}
        placement={placement}
        sameWidth={sameWidth}
      >
        <div
          style={{
            background: glass.fillStrong,
            backdropFilter: `blur(32px) saturate(200%)`,
            WebkitBackdropFilter: `blur(32px) saturate(200%)`,
            borderRadius: 16,
            boxShadow: glass.shadow,
            border: `1px solid ${glass.border}`,
            padding: 6,
            minWidth: 160,
            overflow: 'hidden',
          }}
          role="menu"
        >
          {children}
        </div>
      </Popover>
    </>
  );
}

export { default as Popover } from './Popover';
