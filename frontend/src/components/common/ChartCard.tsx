import { Box, Typography, Skeleton } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  height?: number;
  loading?: boolean;
  action?: ReactNode;
  noData?: boolean;
  noDataMessage?: string;
}

export default function ChartCard({ title, children, height = 300, loading, action, noData, noDataMessage }: ChartCardProps) {
  const { t } = useTranslation();
  if (loading) return <Skeleton variant="rounded" height={height + 80} sx={{ borderRadius: 4 }} />;

  return (
    <GlassCard interactive={false} sx={{ height: '100%', borderRadius: 4 }}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '0.875rem' }}>{title}</Typography>
          {action}
        </Box>
        <Box
          sx={{
            height,
            animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {noData ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              gap={1}
              color="text.secondary"
              sx={{
                animation: 'fadeInUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <InboxOutlinedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
              <Typography variant="body2">{noDataMessage || t('common.noData')}</Typography>
            </Box>
          ) : children}
        </Box>
      </Box>
    </GlassCard>
  );
}
