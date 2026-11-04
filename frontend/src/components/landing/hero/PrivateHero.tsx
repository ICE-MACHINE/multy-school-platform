import { Box, Container, Typography, Chip, Avatar } from '@mui/material';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import SpeedIcon from '@mui/icons-material/Speed';
import ShieldIcon from '@mui/icons-material/Shield';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from '../landingTheme';
import SchoolLogo from '../../common/SchoolLogo';
import statsService from '../../../services/statsService';
import type { PublicSchoolStats } from '../../../types';
import { containerVariants, childVariants, floatVariants, useNavigateSafely, type HeroProps } from './shared';
import HeroCta from './HeroCta';
import TrustBadges from './TrustBadges';

const BAR_HEIGHTS = [42, 68, 55, 82, 62, 92, 74];

const emptyStats: PublicSchoolStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  totalClassrooms: 0,
  totalActivities: 0,
};

export default function PrivateHero({ config, schoolName, schoolPhone, schoolId }: HeroProps) {
  const navigate = useNavigateSafely();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const colors = getLandingColors(config.heroVariant as LandingVariant, mode);
  const [stats, setStats] = useState<PublicSchoolStats>(emptyStats);

  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    statsService.getPublicSchoolStats(schoolId)
      .then((data) => { if (active) setStats(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [schoolId]);

  const miniStats = [
    { v: `${stats.totalStudents}+`, l: t('schoolLanding.privateHero.student') },
    { v: `${stats.totalTeachers}+`, l: t('schoolLanding.privateHero.teacher') },
    { v: `${stats.totalCourses}+`, l: t('schoolLanding.privateHero.subject') },
  ];

  return (
    <Box
      sx={{
        background: isDark ? config.gradientDark : config.gradientLight,
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 13, md: 15 },
        pb: { xs: 11, md: 12 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-40%',
          left: '-15%',
          width: '75%',
          height: '160%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: '70%',
          height: '150%',
          background: 'radial-gradient(ellipse, rgba(129,140,248,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={5}>
            <Box maxWidth={620}>
              <motion.div variants={childVariants} style={{ display: 'inline-block', marginBottom: 14 }}>
                <SchoolLogo variant="private" size={72} />
              </motion.div>
              <motion.div variants={childVariants}>
                <Chip
                  icon={<VerifiedIcon sx={{ fontSize: 15 }} />}
                  label={t('schoolLanding.privateHero.chip')}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)',
                    color: colors.textPrimary,
                    mb: 3,
                    fontWeight: 700,
                    backdropFilter: 'blur(10px)',
                    '& .MuiChip-icon': { color: '#818cf8' },
                  }}
                />
              </motion.div>

              <motion.div variants={childVariants}>
                <Typography
                  variant="h2"
                  sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, fontWeight: 900, mb: 1.5, lineHeight: 1.15, letterSpacing: '-0.02em' }}
                >
                  {schoolName || t('common.appName')}
                </Typography>
              </motion.div>

              <motion.div variants={childVariants}>
                <Typography
                  variant="h5"
                  sx={{ opacity: 0.95, mb: 2, fontWeight: 700, color: isDark ? '#a5b4fc' : '#4338ca' }}
                >
                  {t(config.tagline)}
                </Typography>
              </motion.div>

              <motion.div variants={childVariants}>
                <Typography
                  variant="body1"
                  sx={{ opacity: 0.75, mb: 5, lineHeight: 1.8, maxWidth: 550 }}
                >
                  {t(config.subtitle)}
                </Typography>
              </motion.div>

              <motion.div variants={childVariants}>
                <HeroCta
                  primary={{
                    label: schoolName ? t('auth.login') : t('landing.startNow'),
                    onClick: () => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login'),
                    endIcon: <ArrowIcon />,
                    sx: {
                      bgcolor: 'white',
                      color: config.accentDark,
                      px: 5,
                      py: 1.8,
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: isDark ? 'none' : '1px solid rgba(30,27,75,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' },
                    },
                  }}
                  phone={schoolPhone ? {
                    number: schoolPhone,
                    sx: {
                      borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(30,27,75,0.4)',
                      color: isDark ? 'white' : 'rgba(30,27,75,0.9)',
                      px: 4,
                      py: 1.8,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: isDark ? 'white' : 'rgba(30,27,75,0.9)',
                        bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,27,75,0.06)',
                      },
                    },
                  } : undefined}
                />
              </motion.div>

              <motion.div variants={childVariants}>
                <TrustBadges
                  isDark={isDark}
                  iconColor="#818cf8"
                  sx={{ mt: 3.5 }}
                  items={[
                    { icon: <SpeedIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.privateHero.fastPerformance') },
                    { icon: <ShieldIcon sx={{ fontSize: 16 }} />, label: t('landing.secureData') },
                  ]}
                />
              </motion.div>
            </Box>

            <motion.div variants={childVariants} style={{ flexShrink: 0 }}>
              <motion.div
                animate={{ rotate: [0, 4, 0, -4, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 300, md: 350 },
                    borderRadius: 4,
                    p: 3,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(22px)',
                    WebkitBackdropFilter: 'blur(22px)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(30,27,75,0.15)',
                    boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.4)' : '0 20px 50px rgba(67,56,202,0.2)',
                  }}
                >
                  <motion.div
                    animate={floatVariants.float3}
                    style={{ position: 'absolute', top: -18, right: -14 }}
                  >
                    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 999, bgcolor: '#4f46e5', color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 6px 18px rgba(79,70,229,0.4)' }}>
                      {t('schoolLanding.privateHero.realtimeAttendanceBadge')}
                    </Box>
                  </motion.div>

                  <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                    <Avatar sx={{ width: 42, height: 42, fontSize: 17, fontWeight: 700, borderRadius: '14px', background: 'linear-gradient(135deg, #818cf8, #4f46e5)' }}>
                      {schoolName ? schoolName.charAt(0) : t('schoolLanding.privateHero.fallbackSchoolName').charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {schoolName || t('schoolLanding.privateHero.fallbackSchoolName')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(30,27,75,0.6)' }} noWrap>
                        {t('schoolLanding.privateHero.dashboardCaption')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="flex-end" gap={1.5} height={104} mb={2.5}>
                    {BAR_HEIGHTS.map((h, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: `${h}%`,
                          borderRadius: '6px 6px 2px 2px',
                          background: 'linear-gradient(180deg, #818cf8, #4f46e5)',
                          opacity: 0.55 + i * 0.06,
                        }}
                      />
                    ))}
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2.5}>
                    {miniStats.map((s) => (
                      <Box key={s.l} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.1rem', color: isDark ? '#a5b4fc' : '#4338ca' }}>
                          {s.v}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(30,27,75,0.6)' }}>
                          {s.l}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ borderRadius: 2, py: 1, textAlign: 'center', bgcolor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.12)' }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? '#a5b4fc' : '#4338ca' }}>
                      {t('schoolLanding.privateHero.cardTitle')}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
