import { Box, Avatar, Typography, Button } from '@mui/material';
import BackIcon from '@mui/icons-material/ArrowBack';
import type { ReactNode } from 'react';
import GlassCard from './GlassCard';

interface ProfileHeaderProps {
  name: string;
  subtitle?: ReactNode;
  avatarText: string;
  avatarGradient?: string;
  action?: ReactNode;
  backLabel?: string;
  onBack?: () => void;
}

export default function ProfileHeader({
  name,
  subtitle,
  avatarText,
  avatarGradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  action,
  backLabel,
  onBack,
}: ProfileHeaderProps) {
  return (
    <GlassCard sx={{ p: 3.5, mb: 3, animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {backLabel && onBack && (
        <Button
          startIcon={<BackIcon />}
          onClick={onBack}
          sx={{ mb: 2, px: 0, textTransform: 'none', color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
        >
          {backLabel}
        </Button>
      )}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={2.5}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              background: avatarGradient,
              boxShadow: '0 8px 22px rgba(99, 102, 241, 0.35)',
            }}
          >
            {avatarText}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.3 }}>{name}</Typography>
            {subtitle && <Box mt={0.75}>{subtitle}</Box>}
          </Box>
        </Box>
        {action}
      </Box>
    </GlassCard>
  );
}
