import type { BoxProps } from '@mui/material';
import GlassSurface from './GlassSurface';

interface GlassCardProps extends BoxProps {
  interactive?: boolean;
}

export default function GlassCard({ interactive = true, sx, ...props }: GlassCardProps) {
  return (
    <GlassSurface
      interactive={interactive}
      {...props}
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        ...sx,
      }}
    />
  );
}
