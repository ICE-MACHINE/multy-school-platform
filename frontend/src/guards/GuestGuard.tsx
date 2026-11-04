import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'super_admin') {
      return <Navigate to="/superAdmin/dashboard" replace />;
    }
    if (user.role === 'school_admin') {
      return <Navigate to={`/s/${user.schoolSlug}/admin/dashboard`} replace />;
    }
    if (user.role === 'teacher') {
      return <Navigate to={`/s/${user.schoolSlug}/teacher/dashboard`} replace />;
    }
    if (user.role === 'parent') {
      return <Navigate to={`/s/${user.schoolSlug}/parent/dashboard`} replace />;
    }
  }

  return <>{children}</>;
}
