import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box
      py={{ xs: 6, md: 8 }}
      px={2}
      textAlign="center"
      sx={{
        maxWidth: 520,
        mx: 'auto',
        animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 24px -16px rgba(16,24,40,0.35)',
          color: 'text.secondary',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { transform: 'translateY(-1px) scale(1.03)', color: 'primary.main' },
          '& .MuiSvgIcon-root': { fontSize: 32 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.012em', lineHeight: 1.35 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto" mb={3} sx={{ lineHeight: 1.7 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outlined"
          onClick={onAction}
          sx={{
            mt: description ? 0 : 1,
            transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
