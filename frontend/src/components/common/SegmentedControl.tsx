import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface SegmentOption<T> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
}

export default function SegmentedControl<T extends string | number>({ value, onChange, options }: SegmentedControlProps<T>) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 999, border: '1px solid', borderColor: 'divider' }}>
      {options.map((o) => (
        <Box
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            bgcolor: value === o.value ? 'primary.main' : 'transparent',
            color: value === o.value ? 'primary.contrastText' : 'text.secondary',
            transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { bgcolor: value === o.value ? 'primary.main' : 'action.selected' },
          }}
        >
          {o.icon}
          <Typography fontWeight={600} fontSize="0.85rem">{o.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}
