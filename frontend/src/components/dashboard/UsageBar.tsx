import type { ReactNode } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface UsageBarProps {
  label: string;
  current: number;
  max: number;
  color?: string;
  icon?: ReactNode;
}

export default function UsageBar({ label, current, max, color = '#0f62fe', icon }: UsageBarProps) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}1F`,
                color,
                '& .MuiSvgIcon-root': { fontSize: 16 },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }} noWrap>
            {label}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: pct > 80 ? '#da1e28' : 'text.secondary' }} noWrap>
          {current}/{max} ({pct.toFixed(0)}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 9,
          borderRadius: 4,
          bgcolor: 'divider',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: pct > 80 ? '#da1e28' : color,
            transition: 'width 110ms cubic-bezier(0.2, 0, 0.38, 0.9)',
          },
        }}
      />
    </Box>
  );
}
