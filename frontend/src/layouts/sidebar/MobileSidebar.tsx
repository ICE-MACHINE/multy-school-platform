import { Box, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { getGlass, glassBlur } from '../../theme/glass';
import type { MenuItemDef } from './menuConfig';

const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface MobileSidebarProps {
  open: boolean;
  mode: 'light' | 'dark';
  menuItems: MenuItemDef[];
  activePath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

export default function MobileSidebar({ open, mode, menuItems, activePath, onNavigate, onClose }: MobileSidebarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (!open) return null;
  const glass = getGlass(mode);

  const activeBg = alpha(theme.palette.primary.main, mode === 'dark' ? 0.2 : 0.12);
  const hoverBg = alpha(theme.palette.text.primary, mode === 'dark' ? 0.08 : 0.05);
  const activeColor = theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main;

  return (
    <>
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.58)' : 'rgba(16,24,40,0.32)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: `fadeInUp 200ms ${SPRING}`,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: 0, bottom: 0,
          right: 0,
          width: 280,
          zIndex: 1301,
          bgcolor: glass.fillStrong,
          backdropFilter: `blur(${glassBlur.xl}) ${glass.saturation}`,
          WebkitBackdropFilter: `blur(${glassBlur.xl}) ${glass.saturation}`,
          borderRight: '1px solid',
          borderColor: glass.hairline,
          boxShadow: `inset 0 1px 0 ${mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'}, ${glass.shadowHover}`,
          backgroundImage:
            mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 32%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 32%)',
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          animation: `fadeInUp 220ms ${SPRING}`,
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, pt: 1, pb: 2 }}>
          {menuItems.map((item) => {
            const active = activePath === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => onNavigate(item.path)}
                selected={active}
                sx={{
                  position: 'relative',
                  borderRadius: '10px',
                  mb: 0.75,
                  minHeight: 46,
                  px: 1.25,
                  transition: `background-color 180ms ${SPRING}, color 180ms ${SPRING}, box-shadow 180ms ${SPRING}`,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '22%',
                    bottom: '22%',
                    width: 3,
                    borderRadius: 999,
                    bgcolor: activeColor,
                    opacity: active ? 1 : 0,
                    transform: active ? 'scaleY(1)' : 'scaleY(0.4)',
                    transition: `opacity 180ms ${SPRING}, transform 180ms ${SPRING}`,
                  },
                  '&:hover': { bgcolor: active ? activeBg : hoverBg, color: active ? activeColor : 'text.primary' },
                  '&.Mui-selected': {
                    bgcolor: activeBg,
                    color: activeColor,
                    boxShadow:
                      mode === 'dark'
                        ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 16px -10px rgba(0,0,0,0.55)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.55), 0 6px 16px -10px rgba(15,98,254,0.45)',
                    '&:hover': { bgcolor: activeBg },
                    '& .MuiListItemIcon-root': { color: activeColor },
                    '& .MuiListItemText-primary': { fontWeight: 700 },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: active ? activeColor : 'text.secondary',
                    transition: `color 180ms ${SPRING}`,
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={t(item.labelKey)}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    lineHeight: 1.35,
                    letterSpacing: '-0.005em',
                    fontWeight: active ? 700 : 500,
                    color: active ? activeColor : 'text.primary',
                  }}
                />
              </ListItemButton>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
