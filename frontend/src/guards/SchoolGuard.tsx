import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SchoolGuardProps {
  children: React.ReactNode;
}

export default function SchoolGuard({ children }: SchoolGuardProps) {
  const { schoolId } = useParams<{ schoolId: string }>();
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user?.schoolSlug && schoolId && user.schoolSlug !== schoolId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
