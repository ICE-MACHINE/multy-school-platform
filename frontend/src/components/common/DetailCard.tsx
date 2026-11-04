import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import GlassCard from './GlassCard';

interface DetailCardProps {
  title: string;
  icon?: ReactNode;
  iconColor?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: Record<string, unknown>;
}

export default function DetailCard({ title, icon, iconColor = '#6366f1', action, children, sx }: DetailCardProps) {
  return (
    <GlassCard sx={{ p: 3.5, animation: 'fadeInUp 350ms cubic-bezier(0.16, 1, 0.3, 1)', ...sx }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${iconColor}18`,
                color: iconColor,
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Box>
        {action}
      </Box>
      {children}
    </GlassCard>
  );
}

export function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }} component="div">
        {value}
      </Typography>
    </Box>
  );
}
