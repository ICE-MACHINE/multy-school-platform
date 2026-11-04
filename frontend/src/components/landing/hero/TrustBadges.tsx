import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export interface TrustBadgeItem {
  icon: ReactNode;
  label: string;
}

interface TrustBadgesProps {
  items: TrustBadgeItem[];
  iconColor: string;
  isDark: boolean;
  center?: boolean;
  sx?: object;
}

export default function TrustBadges({ items, iconColor, isDark, center = false, sx }: TrustBadgesProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        justifyContent: center ? 'center' : undefined,
        ...sx,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 0.9,
            borderRadius: 999,
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <Box component="span" sx={{ display: 'flex', color: iconColor }}>{item.icon}</Box>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
