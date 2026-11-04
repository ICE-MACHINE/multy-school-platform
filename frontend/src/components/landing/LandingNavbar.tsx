import { useEffect, useState } from 'react';
import { Box, Container, Button, Divider } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import DarkIcon from '@mui/icons-material/DarkMode';
import LightIcon from '@mui/icons-material/LightMode';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { easings, durations } from '../../theme/motion';
import { useTheme } from '../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from './landingTheme';
import SchoolLogo, { type LogoVariant } from '../common/SchoolLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import type { SchoolTypeConfig } from './landingTypes';

interface LandingNavbarProps {
  config: SchoolTypeConfig;
  schoolName?: string;
  schoolId?: string;
  isRoot?: boolean;
}

export default function LandingNavbar({ config, schoolName, schoolId, isRoot }: LandingNavbarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';
  const colors = getLandingColors(config.navbarVariant as LandingVariant, mode);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: durations.normal / 1000, ease: easings.spring }}
    >
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 1100,
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          bgcolor: colors.navbarBg,
          borderBottom: '1px solid',
          borderColor: scrolled ? colors.navbarBorder : 'transparent',
          boxShadow: scrolled
            ? isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 16px 36px -24px rgba(0,0,0,0.75)'
              : 'inset 0 1px 0 rgba(255,255,255,0.65), 0 16px 36px -26px rgba(16,24,40,0.45)'
            : 'none',
          transition: 'box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
            sx={{ minHeight: 64, py: scrolled ? 1 : 1.25, transition: 'padding 220ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15, ease: easings.spring }}>
              <SchoolLogo
                variant={(isRoot ? 'root' : config.id) as LogoVariant}
                size={34}
                withTitle
                title={schoolName || t('common.appName')}
                animate={false}
                titleColor={isDark ? 'rgba(255,255,255,0.95)' : 'rgba(30,27,75,0.9)'}
              />
            </motion.div>

            <Box display="flex" alignItems="center" gap={{ xs: 1, md: 1.25 }}>
              {isRoot && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.2, ease: easings.spring }}
                >
                  <Button
                    variant="text"
                    onClick={() => navigate('/superAdmin/login')}
                    sx={{
                      borderRadius: 999,
                      px: 1.75,
                      fontWeight: 600,
                      color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(30,27,75,0.75)',
                      '&:hover': {
                        color: isDark ? 'white' : 'rgba(30,27,75,1)',
                        bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,27,75,0.07)',
                      },
                    }}
                  >
                    {t('auth.adminEntry')}
                  </Button>
                </motion.div>
              )}
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  display: { xs: 'none', md: 'block' },
                  my: 1.25,
                  borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(16,24,40,0.1)',
                }}
              />
              <LanguageSwitcher compact />
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2, ease: easings.spring }}
              >
                <Button
                  onClick={toggleTheme}
                  aria-label={t('landing.toggleTheme')}
                  sx={{
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    p: 0,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(16,24,40,0.1)',
                    color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(30,27,75,0.85)',
                    '&:hover': {
                      borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(16,24,40,0.22)',
                      bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(30,27,75,0.07)',
                    },
                  }}
                >
                  {isDark ? <LightIcon /> : <DarkIcon />}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: easings.spring }}
              >
                <Button
                  variant="contained"
                  onClick={() => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login')}
                  sx={{
                    bgcolor: config.accentColor,
                    color: 'white',
                    px: 3,
                    py: 1.125,
                    minHeight: 42,
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '-0.005em',
                    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 20px -6px ${config.accentColor}55`,
                    '&:hover': {
                      bgcolor: config.accentLight,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 12px 28px -8px ${config.accentLight}60`,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  endIcon={isRoot ? <ArrowIcon /> : <LoginIcon />}
                >
                  {isRoot ? t('landing.startNow') : t('auth.login')}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Container>
      </Box>
    </motion.div>
  );
}
