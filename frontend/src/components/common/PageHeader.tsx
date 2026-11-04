import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export default function PageHeader({ title, subtitle, action, actionLabel, onAction, actionIcon }: PageHeaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      flexWrap="wrap"
      gap={2}
      mb={{ xs: 2.5, md: 3.5 }}
      sx={{
        animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={1.75} sx={{ minWidth: 0, flex: '1 1 320px' }}>
        <Box
          sx={{
            width: 4,
            alignSelf: 'stretch',
            minHeight: 44,
            borderRadius: 999,
            flexShrink: 0,
            background: 'linear-gradient(180deg, #0f62fe 0%, #4589ff 55%, #009d9a 100%)',
            boxShadow: '0 4px 12px -4px rgba(15, 98, 254, 0.55)',
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ letterSpacing: '-0.02em', lineHeight: 1.22, fontSize: { xs: '1.375rem', md: '1.5rem' } }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              mt={0.625}
              sx={{
                maxWidth: 680,
                lineHeight: 1.65,
                animation: 'slideDown 200ms 100ms cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action ? (
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} sx={{ pt: { xs: 0, md: 0.25 } }}>
          {action}
        </Box>
      ) : (
        actionLabel && onAction && (
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onAction}
            sx={{
              flexShrink: 0,
              mt: { xs: 0.5, md: 0.25 },
              transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            {actionLabel}
          </Button>
        )
      )}
    </Box>
  );
}
