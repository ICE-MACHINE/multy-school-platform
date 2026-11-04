import { useState } from 'react';
import { Box, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { getGlass, glassBlur } from '../../theme/glass';
import { SIDEBAR_WIDTH, type MenuGroupDef } from './menuConfig';

const RAIL_WIDTH = 68;
const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface SidebarNavProps {
  mode: 'light' | 'dark';
  menuGroups: MenuGroupDef[];
  activePath: string;
  onNavigate: (path: string) => void;
}

export default function SidebarNav({ mode, menuGroups, activePath, onNavigate }: SidebarNavProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const glass = getGlass(mode);
  const [expanded, setExpanded] = useState(false);

  const activeBg = alpha(theme.palette.primary.main, mode === 'dark' ? 0.2 : 0.12);
  const hoverBg = alpha(theme.palette.text.primary, mode === 'dark' ? 0.08 : 0.05);
  const iconActiveColor = theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main;

  return (
    <Box
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      sx={{
        width: expanded ? SIDEBAR_WIDTH : RAIL_WIDTH,
        flexShrink: 0,
        transition: `width 220ms ${SPRING}`,
        overflowX: 'hidden',
        borderLeft: '1px solid',
        borderColor: glass.hairline,
        bgcolor: glass.fillStrong,
        backdropFilter: `blur(${glassBlur.lg}) ${glass.saturation}`,
        WebkitBackdropFilter: `blur(${glassBlur.lg}) ${glass.saturation}`,
        boxShadow: `inset 0 1px 0 ${mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)'}, 12px 0 32px -24px rgba(16,24,40,0.25)`,
        backgroundImage:
          mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 32%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 32%)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        pt: '56px',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        '&::-webkit-scrollbar': { width: 0 },
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pt: 2.5,
          pb: 2,
          px: expanded ? 1.25 : 0.75,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.text.secondary, 0.25),
          },
        }}
      >
        {menuGroups.map((g) => (
          <Box key={g.groupLabelKey || '__main'} sx={{ mb: 2.5, '&:last-of-type': { mb: 1 } }}>
            {g.groupLabelKey && expanded && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.25,
                  mt: 0.5,
                  mb: 0.75,
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.625rem',
                  lineHeight: 1.5,
                  opacity: 0.75,
                }}
              >
                {t(g.groupLabelKey)}
              </Typography>
            )}
            {g.items.map((item) => {
              const active = activePath === item.path;
              const button = (
                <ListItemButton
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  selected={active}
                  sx={{
                    position: 'relative',
                    borderRadius: expanded ? '10px' : '12px',
                    mb: 0.75,
                    minHeight: 42,
                    px: expanded ? 1.25 : 0,
                    py: 0.75,
                    gap: 0.25,
                    justifyContent: expanded ? 'flex-start' : 'center',
                    fontWeight: active ? 600 : 400,
                    transition: `background-color 180ms ${SPRING}, color 180ms ${SPRING}, box-shadow 180ms ${SPRING}`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '22%',
                      bottom: '22%',
                      width: 3,
                      borderRadius: 999,
                      bgcolor: iconActiveColor,
                      opacity: active && expanded ? 1 : 0,
                      transform: active && expanded ? 'scaleY(1)' : 'scaleY(0.4)',
                      transition: `opacity 180ms ${SPRING}, transform 180ms ${SPRING}`,
                    },
                    '&:hover': {
                      bgcolor: active ? activeBg : hoverBg,
                      color: active ? iconActiveColor : 'text.primary',
                    },
                    '&.Mui-selected': {
                      bgcolor: expanded ? activeBg : 'transparent',
                      color: iconActiveColor,
                      boxShadow:
                        expanded && mode === 'dark'
                          ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 16px -10px rgba(0,0,0,0.55)'
                          : expanded
                            ? 'inset 0 1px 0 rgba(255,255,255,0.55), 0 6px 16px -10px rgba(15,98,254,0.45)'
                            : 'none',
                      '&:hover': { bgcolor: expanded ? activeBg : hoverBg },
                      '& .MuiListItemText-primary': { fontWeight: 700 },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      flexShrink: 0,
                      width: expanded ? undefined : 36,
                      height: expanded ? undefined : 36,
                      borderRadius: expanded ? undefined : '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: !expanded && active ? activeBg : 'transparent',
                      boxShadow:
                        !expanded && active
                          ? mode === 'dark'
                            ? 'inset 0 1px 0 rgba(255,255,255,0.08)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.5)'
                          : undefined,
                      color: active ? iconActiveColor : 'text.secondary',
                      transition: `color 180ms ${SPRING}, background-color 180ms ${SPRING}, transform 180ms ${SPRING}`,
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {expanded && (
                    <ListItemText
                      primary={t(item.labelKey)}
                      primaryTypographyProps={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.35,
                        letterSpacing: '-0.005em',
                        fontWeight: active ? 700 : 500,
                        color: active ? iconActiveColor : 'text.primary',
                      }}
                    />
                  )}
                </ListItemButton>
              );
              return expanded ? (
                button
              ) : (
                <Tooltip key={item.path} title={t(item.labelKey)} placement="left" arrow>
                  {button}
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
