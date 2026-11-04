import type { ReactNode } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';

interface DataCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
  loading?: boolean;
  action?: ReactNode;
  noData?: boolean;
  noDataMessage?: string;
}

export default function DataCard({
  title, subtitle, children, height = 320,
  loading, action, noData, noDataMessage,
}: DataCardProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <GlassCard interactive={false} sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
        {subtitle && <Skeleton variant="text" width="60%" height={16} sx={{ mb: 3 }} />}
        <Skeleton variant="rectangular" height={height} />
      </GlassCard>
    );
  }

  return (
    <GlassCard
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box
        sx={{
          flex: 1,
          height: noData ? height : 'auto',
          minHeight: noData ? undefined : height,
          px: 3,
          pb: 3,
          pt: 2,
          display: 'flex',
        }}
      >
        {noData ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            width="100%"
            gap={1}
            sx={{ color: 'text.secondary' }}
          >
            <InboxOutlinedIcon sx={{ fontSize: 40, opacity: 0.3 }} />
            <Typography variant="body2">{noDataMessage || t('common.noData')}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height, minHeight: height }}>
            {children}
          </Box>
        )}
      </Box>
    </GlassCard>
  );
}
