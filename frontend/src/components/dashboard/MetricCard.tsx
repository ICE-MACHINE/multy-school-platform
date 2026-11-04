import type { ReactNode } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const chipSizes = { sm: 38, md: 44, lg: 52 } as const;
const iconSizes = { sm: 19, md: 22, lg: 26 } as const;

export default function MetricCard({ title, value, icon, trend, color = '#0f62fe', loading, size = 'md' }: MetricCardProps) {
  const { t } = useTranslation();
  const chip = chipSizes[size];
  const trendColor = trend ? (trend.isPositive ? '#24a148' : '#da1e28') : undefined;

  if (loading) {
    return (
      <GlassCard interactive={false} sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="65%" height={14} />
            <Skeleton variant="text" width="45%" height={size === 'lg' ? 40 : 30} sx={{ mt: 1 }} />
          </Box>
          <Skeleton variant="rounded" width={chip} height={chip} />
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard sx={{ p: 2.5, position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}22)`,
          opacity: 0.9,
        }}
      />
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}
          >
            {title}
          </Typography>
          <Typography
            variant={size === 'lg' ? 'h3' : 'h5'}
            fontWeight={700}
            sx={{
              mt: 0.75,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontSize: size === 'sm' ? '1.375rem' : undefined,
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: chip,
            height: chip,
            borderRadius: 2.25,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}1F`,
            color,
            '& .MuiSvgIcon-root': { fontSize: iconSizes[size] },
          }}
        >
          {icon}
        </Box>
      </Box>
      {trend && trendColor && (
        <Box display="flex" alignItems="center" gap={0.75} mt={1.25}>
          <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: `${trendColor}1A`, color: trendColor }}>
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.6875rem' }}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('common.comparedToPreviousMonth')}
          </Typography>
        </Box>
      )}
    </GlassCard>
  );
}
