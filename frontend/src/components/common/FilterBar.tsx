import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import GlassSurface from './GlassSurface';

interface FilterRowProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function FilterRow({ children, sx }: FilterRowProps) {
  return (
    <GlassSurface
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 4,
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        flexWrap: 'wrap',
        animation: 'fadeInUp 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        ...sx,
      }}
    >
      {children}
    </GlassSurface>
  );
}
