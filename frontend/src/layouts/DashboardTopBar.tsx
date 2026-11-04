import { Box, Divider, IconButton, Typography, Avatar, Badge, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotifIcon from '@mui/icons-material/Notifications';
import ProfileIcon from '@mui/icons-material/Person';
import { useTranslation } from 'react-i18next';
import SchoolLogo, { type LogoVariant } from '../components/common/SchoolLogo';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { getGlass } from '../theme/glass';

interface DashboardTopBarProps {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  isMobile: boolean;
  onToggleSidebar: () => void;
  logoVariant: LogoVariant;
  brandTitle: string;
  unreadCount: number;
  showNotifications: boolean;
  onOpenNotifications: () => void;
  profilePath: string;
  onNavigate: (path: string) => void;
  onLogoutClick: () => void;
}

export default function DashboardTopBar({
  mode, toggleTheme, isMobile, onToggleSidebar,
  logoVariant, brandTitle, unreadCount, showNotifications,
  onOpenNotifications, profilePath, onNavigate, onLogoutClick,
}: DashboardTopBarProps) {
  const { t } = useTranslation();
  const glass = getGlass(mode);
  const isDark = mode === 'dark';

  const iconButtonSx = {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 2.5,
    color: 'text.secondary',
    transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
      bgcolor: (theme: { palette: { text: { primary: string } } }) => alpha(theme.palette.text.primary, isDark ? 0.1 : 0.06),
      color: 'text.primary',
    },
    '&.Mui-focusVisible': {
      boxShadow: `0 0 0 3px ${alpha('#0f62fe', isDark ? 0.35 : 0.2)}`,
    },
  } as const;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1100,
        bgcolor: glass.fillStrong,
        backdropFilter: 'blur(22px) saturate(185%)',
        WebkitBackdropFilter: 'blur(22px) saturate(185%)',
        borderBottom: '1px solid',
        borderColor: glass.hairline,
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 32px -20px rgba(0,0,0,0.7)'
          : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 30px -22px rgba(16,24,40,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.5, md: 1 },
        px: { xs: 1.5, sm: 2, md: 3 },
        minHeight: 56,
      }}
    >
      {isMobile && (
        <IconButton
          onClick={onToggleSidebar}
          size="small"
          aria-label={t('common.menu')}
          sx={{ ...iconButtonSx, minWidth: 44, minHeight: 44 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: (theme: { palette: { primary: { main: string } } }) => alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
            border: '1px solid',
            borderColor: glass.hairline,
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <SchoolLogo variant={logoVariant} size={26} animate={false} glow={false} />
        </Box>
        <Typography
          variant="body2"
          noWrap
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.875rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {brandTitle}
        </Typography>
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: 'none', sm: 'block' }, my: 1.75, mx: { sm: 0.5, md: 1 }, borderColor: glass.hairline }}
      />

      <Box display="flex" alignItems="center" gap={0.5}>
        {showNotifications && (
          <IconButton
            size="small"
            onClick={onOpenNotifications}
            aria-label={t('common.notifications')}
            sx={iconButtonSx}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 17,
                  height: 17,
                  padding: '0 4px',
                  border: '2px solid',
                  borderColor: isDark ? '#1b1c22' : '#ffffff',
                },
              }}
            >
              <NotifIcon sx={{ fontSize: 21 }} />
            </Badge>
          </IconButton>
        )}
        <LanguageSwitcher compact />
        <Tooltip title={mode === 'dark' ? t('common.lightMode') : t('common.darkMode')} arrow>
          <IconButton size="small" onClick={toggleTheme} sx={iconButtonSx} aria-label={mode === 'dark' ? t('common.lightMode') : t('common.darkMode')}>
            {mode === 'dark' ? <LightModeIcon sx={{ fontSize: 21 }} /> : <DarkModeIcon sx={{ fontSize: 21 }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.profile')} arrow>
          <IconButton
            size="small"
            onClick={() => onNavigate(profilePath)}
            sx={{ ...iconButtonSx, ml: 0.25, p: 0.5 }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: 'primary.main',
                boxShadow: (theme: { palette: { primary: { main: string } } }) =>
                  `0 0 0 2px ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.16)}, 0 4px 10px -4px ${alpha(theme.palette.primary.main, 0.6)}`,
              }}
            >
              <ProfileIcon sx={{ fontSize: 19 }} />
            </Avatar>
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.logout')} arrow>
          <IconButton
            size="small"
            onClick={onLogoutClick}
            sx={{
              ...iconButtonSx,
              '&:hover': {
                bgcolor: 'rgba(218,30,40,0.08)',
                color: 'error.main',
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: 21 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
