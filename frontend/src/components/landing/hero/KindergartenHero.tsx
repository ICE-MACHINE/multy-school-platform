import { Box, Container, Typography, Chip } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Security';
import CameraIcon from '@mui/icons-material/PhotoCamera';
import BabyIcon from '@mui/icons-material/ChildFriendly';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from '../landingTheme';
import SchoolLogo from '../../common/SchoolLogo';
import { containerVariants, childVariants, floatVariants, useNavigateSafely, type HeroProps } from './shared';
import HeroCta from './HeroCta';
import TrustBadges from './TrustBadges';

const BLOBS = [
  { bg: 'rgba(16,185,129,0.16)', size: 170, top: '16%', left: '6%' },
  { bg: 'rgba(251,191,36,0.15)', size: 120, top: '58%', right: '8%' },
  { bg: 'rgba(255,126,182,0.12)', size: 90, top: '36%', right: '30%' },
];

export default function KindergartenHero({ config, schoolName, schoolPhone, schoolId }: HeroProps) {
  const navigate = useNavigateSafely();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const colors = getLandingColors(config.heroVariant as LandingVariant, mode);

  const emojis = ['🌈', '⭐', '🦋', '🌻', '🐝', '🎈', '🎨'];

  return (
    <Box
      sx={{
        background: isDark ? config.gradientDark : config.gradientLight,
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 13, md: 15 },
        pb: { xs: 12, md: 14 },
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', top: 36, right: 70, width: 96, height: 96, borderRadius: '50%', border: '3px dashed rgba(16,185,129,0.35)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: 52, right: 86, width: 64, height: 64, borderRadius: '50%', background: 'radial-gradient(circle, #fde047 0%, #fbbf24 55%, rgba(251,191,36,0.2) 100%)', boxShadow: '0 0 50px rgba(253,224,71,0.55)', pointerEvents: 'none' }}
      />

      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          animate={floatVariants[`float${(i % 3) + 1}` as keyof typeof floatVariants]}
          style={{ position: 'absolute', ...blob, borderRadius: '50%', filter: 'blur(2px)', pointerEvents: 'none' }}
        />
      ))}

      {emojis.map((emoji, i) => (
        <motion.div
          key={emoji}
          animate={{
            y: [0, -18 - i * 4, 0],
            x: [0, i % 2 === 0 ? 12 : -12, 0],
            rotate: [0, i * 8, 0],
          }}
          transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          style={{
            position: 'absolute',
            top: `${10 + i * 11}%`,
            right: i % 2 === 0 ? `${3 + i * 7}%` : 'auto',
            left: i % 2 !== 0 ? `${3 + i * 7}%` : 'auto',
            fontSize: `${1.4 + i * 0.25}rem`,
            opacity: isDark ? 0.35 : 0.45,
            pointerEvents: 'none',
          }}
        >
          {emoji}
        </motion.div>
      ))}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Box maxWidth={760} mx="auto" sx={{ textAlign: 'center' }}>
            <motion.div variants={childVariants}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block', marginBottom: 14 }}
              >
                <Box
                  sx={{
                    width: 108,
                    height: 108,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(6,78,59,0.12)',
                    boxShadow: '0 10px 30px rgba(16,185,129,0.18)',
                  }}
                >
                  <Typography variant="h1" sx={{ fontSize: '3.2rem', lineHeight: 1 }}>🧸</Typography>
                </Box>
              </motion.div>
            </motion.div>

            <motion.div variants={childVariants} style={{ display: 'inline-block', marginBottom: 18 }}>
              <SchoolLogo variant="kindergarten" size={72} />
            </motion.div>
            <motion.div variants={childVariants}>
              <Chip
                label={schoolName ? t('schoolLanding.kindergartenHero.certifiedChip') : t('schoolLanding.kindergartenHero.platformChip')}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
                  color: colors.textPrimary,
                  mb: 3,
                  fontWeight: 700,
                  backdropFilter: 'blur(10px)',
                  fontSize: 13,
                }}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="h2"
                sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, fontWeight: 900, mb: 1.5, lineHeight: 1.15 }}
              >
                {schoolName || t('common.appName')}
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="h5"
                sx={{ opacity: 0.95, mb: 2, fontWeight: 700, color: isDark ? '#fde68a' : '#047857' }}
              >
                {t(config.tagline)}
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <Typography
                variant="body1"
                sx={{ opacity: 0.8, mb: 5, maxWidth: 560, mx: 'auto', lineHeight: 1.8 }}
              >
                {t(config.subtitle)}
              </Typography>
            </motion.div>

            <motion.div variants={childVariants}>
              <HeroCta
                center
                spring
                primary={{
                  label: schoolName ? t('auth.login') : t('schoolLanding.kindergartenHero.discoverNow'),
                  onClick: () => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login'),
                  endIcon: schoolName ? <LoginIcon /> : <ArrowIcon />,
                  sx: {
                    bgcolor: '#fde68a',
                    color: '#065f46',
                    px: 5,
                    py: 1.8,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    boxShadow: '0 8px 32px rgba(253,230,138,0.35)',
                    '&:hover': {
                      bgcolor: '#fcd34d',
                      boxShadow: '0 12px 40px rgba(253,230,138,0.45)',
                    },
                  },
                }}
                phone={schoolPhone ? {
                  number: schoolPhone,
                  sx: {
                    borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(6,78,59,0.4)',
                    color: isDark ? 'white' : 'rgba(6,78,59,0.9)',
                    px: 4,
                    py: 1.8,
                    borderRadius: 12,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: isDark ? 'white' : 'rgba(6,78,59,0.9)',
                      bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(6,78,59,0.06)',
                    },
                  },
                } : undefined}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <TrustBadges
                center
                isDark={isDark}
                iconColor={isDark ? '#fde68a' : '#047857'}
                sx={{ mt: 4, justifyContent: 'center' }}
                items={[
                  { icon: <ShieldIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.kindergartenHero.safeEnvironment') },
                  { icon: <CameraIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.kindergartenHero.dailyUpdates') },
                  { icon: <BabyIcon sx={{ fontSize: 16 }} />, label: t('schoolLanding.kindergartenHero.holisticGrowth') },
                ]}
              />
            </motion.div>
          </Box>
        </motion.div>
      </Container>

      <Box sx={{ position: 'absolute', bottom: -1, left: 0, right: 0, lineHeight: 0, zIndex: 0, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 64, display: 'block' }}>
          <path d="M0,44 C240,80 480,8 720,26 C960,44 1200,84 1440,44 L1440,80 L0,80 Z" fill={colors.sectionBg} />
        </svg>
      </Box>
    </Box>
  );
}
