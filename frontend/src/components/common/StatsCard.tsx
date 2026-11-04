import { Box, Typography, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';


interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  loading?: boolean;
}

export default function StatsCard({ title, value, icon, trend, color = '#0f62fe', loading }: StatsCardProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <GlassCard interactive={false} sx={{ p: 3, height: '100%' }}>
        <Skeleton variant="rounded" width={42} height={42} sx={{ mb: 2, borderRadius: '12px' }} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={36} />
      </GlassCard>
    );
  }

  const trendColor = trend?.isPositive ? '#12805c' : '#da1e28';

  return (
    <GlassCard sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} mb={2.25}>
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight={600}
          sx={{ fontSize: '0.8125rem', lineHeight: 1.45, letterSpacing: '0.01em', pt: 0.5 }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.11),
            border: `1px solid ${alpha(color, 0.2)}`,
            boxShadow: `inset 0 1px 0 ${alpha('#ffffff', 0.55)}, 0 6px 16px -10px ${alpha(color, 0.65)}`,
            color: color,
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { transform: 'translateY(-1px) scale(1.04)', bgcolor: alpha(color, 0.16) },
            '& .MuiSvgIcon-root': { fontSize: 21 },
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography
        variant="h4"
        fontWeight={700}
        className="tnum"
        sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', lineHeight: 1.15, fontSize: '1.625rem' }}
      >
        {value}
      </Typography>
      {trend && (
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.75} mt={1.25}>
          <Typography
            variant="caption"
            fontWeight={700}
            className="tnum"
            sx={{
              color: trendColor,
              bgcolor: alpha(trendColor, 0.1),
              border: `1px solid ${alpha(trendColor, 0.16)}`,
              borderRadius: 999,
              px: 0.875,
              py: 0.25,
              lineHeight: 1.35,
              fontVariantNumeric: 'tabular-nums',
              transition: 'opacity 200ms ease',
            }}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>{t('common.comparedToPreviousMonth')}</Typography>
        </Box>
      )}
    </GlassCard>
  );
}
