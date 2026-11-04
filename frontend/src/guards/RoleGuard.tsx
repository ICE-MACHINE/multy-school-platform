import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { Box, Typography } from '@mui/material';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
        <Typography variant="h4" color="error">403</Typography>
        <Typography variant="body1">Access Denied</Typography>
        <Navigate to="/" replace />
      </Box>
    );
  }

  return <>{children}</>;
}
