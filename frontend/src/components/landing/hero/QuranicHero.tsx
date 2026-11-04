import { Box, Container, Typography, Chip } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import VerifiedIcon from '@mui/icons-material/Verified';
import QuranIcon from '@mui/icons-material/AutoStories';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GroupsIcon from '@mui/icons-material/Groups';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from '../landingTheme';
import SchoolLogo from '../../common/SchoolLogo';
import { containerVariants, childVariants, floatVariants, useNavigateSafely, type HeroProps } from './shared';
import HeroCta from './HeroCta';
import TrustBadges from './TrustBadges';

export default function QuranicHero({ config, schoolName, schoolPhone, schoolId }: HeroProps) {
  const navigate = useNavigateSafely();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const colors = getLandingColors(config.heroVariant as LandingVariant, mode);

  return (
    <Box
      sx={{
        background: isDark ? config.gradientDark : config.gradientLight,
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 13, md: 16 },
        pb: { xs: 12, md: 14 },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M30 4l4 6 7-2-3 7 6 4-7 3 1 7-8-2-8 2 1-7-7-3 6-4-3-7 7 2 4-6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: isDark ? 0.5 : 0.25,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div
            animate={floatVariants.float1}
            style={{
              position: 'absolute', top: 90, right: 30, width: 340, height: 340,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, transparent 70%)',
              filter: 'blur(24px)',
            }}
          />
          <motion.div
            animate={floatVariants.float2}
            style={{
              position: 'absolute', bottom: 50, left: 40, width: 260, height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251,191,36,0.16) 0%, transparent 70%)',
              filter: 'blur(18px)',
            }}
          />

          <Box maxWidth={820} mx="auto" sx={{ textAlign: 'center' }}>
            <motion.div variants={childVariants} style={{ display: 'inline-block', marginBottom: 18 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <svg
                  width="132"
                  height="150"
                  viewBox="0 0 132 150"
                  style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -55%)', overflow: 'visible' }}
                >
                  <path
                    d="M66 8 C 104 8, 126 42, 126 80 L 126 148 L 6 148 L 6 80 C 6 42, 28 8, 66 8 Z"
                    fill="none"
                    stroke="rgba(245,158,11,0.55)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M66 16 C 99 16, 118 46, 118 80 L 118 144 L 14 144 L 14 80 C 14 46, 33 16, 66 16 Z"
                    fill="rgba(245,158,11,0.06)"
                    stroke="rgba(245,158,11,0.25)"
                    strokeWidth="1"
                  />
                </svg>
                <Box sx={{ position: 'relative', p: 1.5 }}>
                  <SchoolLogo variant="quranic" size={78} />
                </Box>
              </Box>
            </motion.div>

            <motion.div variants={childVariants}>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: 15 }} />}
                label={schoolName ? t('schoolLanding.quranicHero.verifiedChip') : t('schoolLanding.quranicHero.platformChip')}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)',
                  color: colors.textPrimary,
                  mb: 3,
                  backdropFilter: 'blur(10px)',
                  fontWeight: 700,
                  fontSize: 13,
                  '& .MuiChip-icon': { color: '#f59e0b' },
                }}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: '3rem', md: '4.2rem' }, fontWeight: 900, mb: 1, lineHeight: 1.1, letterSpacing: '-0.02em' }}
              >
                ﷽
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="h2"
                sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, mb: 1.5, lineHeight: 1.2, letterSpacing: '-0.02em' }}
              >
                {schoolName || t('common.appName')}
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="h5"
                sx={{ opacity: 0.95, fontWeight: 700, fontSize: { xs: '1.15rem', md: '1.4rem' } }}
              >
                {t(config.tagline)}
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <Box display="flex" alignItems="center" gap={1.5} my={2.5} justifyContent="center">
                <Box sx={{ height: 1, width: 64, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.7))' }} />
                <Typography sx={{ color: '#f59e0b', fontSize: 15, lineHeight: 1 }}>✦</Typography>
                <Box sx={{ height: 1, width: 64, background: 'linear-gradient(90deg, rgba(245,158,11,0.7), transparent)' }} />
              </Box>
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="body1"
                sx={{ opacity: 0.75, mb: 5, maxWidth: 600, mx: 'auto', lineHeight: 1.8, fontSize: { xs: '0.95rem', md: '1.05rem' } }}
              >
                {t(config.subtitle)}
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <HeroCta
                center
                primary={{
                  label: schoolName ? t('auth.login') : t('landing.startNow'),
                  onClick: () => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login'),
                  endIcon: <LoginIcon />,
                  sx: {
                    bgcolor: 'white',
                    color: config.accentDark,
                    px: 5,
                    py: 1.8,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    border: isDark ? 'none' : '1px solid rgba(69,26,3,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    },
                  },
                }}
                phone={schoolPhone ? {
                  number: schoolPhone,
                  sx: {
                    borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(69,26,3,0.4)',
                    color: isDark ? 'white' : 'rgba(69,26,3,0.9)',
                    px: 4,
                    py: 1.8,
                    borderRadius: 3,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: isDark ? 'white' : 'rgba(69,26,3,0.9)',
                      bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(69,26,3,0.06)',
                    },
                  },
                } : undefined}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <TrustBadges
                center
                isDark={isDark}
                iconColor="#f59e0b"
                sx={{ mt: 4, justifyContent: 'center' }}
                items={[
                  { icon: <QuranIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.quranic.features.surahTracking.title') },
                  { icon: <ScheduleIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.quranicHero.periodicReports') },
                  { icon: <GroupsIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.quranicHero.parentInvolvement') },
                ]}
              />
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
