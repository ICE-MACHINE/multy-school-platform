import { type ReactNode, type FocusEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { easings, durations, inputTransition } from '../../theme/motion';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  onFocus?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function Input({
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled,
  type = 'text',
  multiline,
  rows = 3,
  startAdornment,
  endAdornment,
  fullWidth,
  className,
  onFocus,
  onBlur,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const handleFocus = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  const inputStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : undefined,
    position: 'relative',
    opacity: disabled ? 0.5 : 1,
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: 0,
    background: 'transparent',
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'inherit',
    outline: 'none',
    borderRadius: 10,
    lineHeight: 1.5,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    border: `1px solid ${error ? '#ef4444' : hovered ? primary : focused ? primary : theme.palette.divider}`,
    background: 'transparent',
    transition: `border-color ${durations.fast}ms ${easings.spring.join(',')}, box-shadow ${durations.fast}ms ${easings.spring.join(',')}`,
    boxShadow: focused
      ? `0 0 0 3px ${error ? 'rgba(239, 68, 68, 0.15)' : `${primary}26`}`
      : 'none',
  };

  const Tag = multiline ? 'textarea' : 'input';

  return (
    <motion.div
      initial={false}
      animate={{ y: focused ? -1 : 0 }}
      transition={inputTransition}
      style={inputStyle}
      className={className}
    >
      {label && (
        <motion.label
          animate={{
            color: error ? '#ef4444' : focused ? primary : 'inherit',
          }}
          transition={inputTransition}
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {label}
        </motion.label>
      )}
      <div
        style={containerStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {startAdornment && (
          <span style={{ display: 'flex', paddingLeft: 8, color: focused ? primary : 'inherit' }}>
            {startAdornment}
          </span>
        )}
        <Tag
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          type={multiline ? undefined : type}
          rows={multiline ? rows : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...inputBaseStyle,
            resize: multiline ? 'vertical' : 'none',
          }}
        />
        {endAdornment && (
          <span style={{ display: 'flex', paddingRight: 8 }}>{endAdornment}</span>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: durations.fast / 1000, ease: easings.spring }}
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: '#ef4444',
          }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
