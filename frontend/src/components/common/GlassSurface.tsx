import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { BoxProps } from '@mui/material';
import type { CSSProperties } from 'react';
import { glassSurface, glassTokens, type GlassMode, type GlassStrength } from '../../theme/glass';

interface GlassSurfaceProps extends BoxProps {
  blur?: number;
  strength?: GlassStrength;
  tone?: GlassMode | 'auto';
  interactive?: boolean;
  style?: CSSProperties;
}

export default function GlassSurface({
  blur = 24,
  strength = 'default',
  tone = 'auto',
  interactive = false,
  style,
  ...props
}: GlassSurfaceProps) {
  const theme = useTheme();
  const mode: GlassMode = tone === 'auto' ? (theme.palette.mode as GlassMode) : tone;
  const glass = glassSurface(mode, strength, blur);

  return (
    <Box
      {...props}
      sx={{
        position: 'relative',
        backgroundColor: glass.backgroundColor,
        backdropFilter: glass.backdropFilter,
        WebkitBackdropFilter: glass.WebkitBackdropFilter,
        border: glass.border,
        boxShadow: glass.boxShadow,
        ...(interactive
          ? {
              transition:
                'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                boxShadow: glassTokens[mode].shadowHover,
                transform: 'translateY(-2px)',
              },
            }
          : {}),
        ...props.sx,
      }}
      style={style}
    />
  );
}
