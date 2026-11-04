import { useState, Suspense } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Box, CircularProgress, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/common/ConfirmDialog';
import type { LogoVariant } from '../components/common/SchoolLogo';
import DashboardTopBar from './DashboardTopBar';
import SidebarNav from './sidebar/SidebarNav';
import MobileSidebar from './sidebar/MobileSidebar';
import { getMenuItems, groupMenuItems, type Role } from './sidebar/menuConfig';
import { useAuth } from '../hooks/useAuth';
import { useTheme as useAppTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { useSchool } from '../hooks/useSchool';
import { getLoginRedirectPath } from '../utils/tokenKeys';
import { ambientBackground } from '../theme/glass';

interface DashboardLayoutProps {
  role: Role;
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolId: paramSchoolId } = useParams<{ schoolId: string }>();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const { unreadCount } = useNotifications();
  const { schoolType } = useSchool();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const schoolId = paramSchoolId || user?.schoolId;
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [logoutDialog, setLogoutDialog] = useState(false);

  const logoVariant = (role === 'super_admin' ? 'root' : schoolType) as LogoVariant;
  const brandTitle = role === 'super_admin' ? t('common.appName') : schoolId || '';
  const profilePath = role === 'super_admin'
    ? '/superAdmin/profile'
    : `/s/${schoolId}/${role === 'school_admin' ? 'admin' : role}/profile`;
  const notificationsPath = `/s/${schoolId}/${role === 'school_admin' ? 'admin' : role}/notifications`;

  const menuItems = getMenuItems(role, schoolId, schoolType);
  const menuGroups = groupMenuItems(menuItems, role);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: ambientBackground(mode),
        backgroundAttachment: 'fixed',
      }}
    >
      <CssBaseline />

      <DashboardTopBar
        mode={mode}
        toggleTheme={toggleTheme}
        isMobile={isMobile}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        logoVariant={logoVariant}
        brandTitle={brandTitle}
        unreadCount={unreadCount}
        showNotifications={role !== 'super_admin'}
        onOpenNotifications={() => handleNavigate(notificationsPath)}
        profilePath={profilePath}
        onNavigate={handleNavigate}
        onLogoutClick={() => setLogoutDialog(true)}
      />

      {!isMobile && (
        <SidebarNav
          mode={mode}
          menuGroups={menuGroups}
          activePath={location.pathname}
          onNavigate={handleNavigate}
        />
      )}

      <MobileSidebar
        open={isMobile && sidebarOpen}
        mode={mode}
        menuItems={menuItems}
        activePath={location.pathname}
        onNavigate={handleNavigate}
        onClose={() => setSidebarOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 1560,
          mx: 'auto',
          mt: { xs: 7, md: 7 },
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          pt: { xs: 2.5, md: 3.5 },
          pb: { xs: 4, md: 5 },
          minHeight: '100vh',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <RouteErrorBoundary resetKey={location.pathname}>
          <Suspense
            fallback={(
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                <CircularProgress size={36} />
              </Box>
            )}
          >
            <Outlet key={location.pathname} />
          </Suspense>
        </RouteErrorBoundary>
      </Box>

      <ConfirmDialog
        open={logoutDialog}
        title={t('layout.logoutConfirmTitle')}
        message={t('auth.logoutConfirm')}
        confirmText={t('common.logout')}
        onConfirm={() => { setLogoutDialog(false); const redirectTo = getLoginRedirectPath(); logout(); navigate(redirectTo); }}
        onCancel={() => setLogoutDialog(false)}
      />
    </Box>
  );
}
