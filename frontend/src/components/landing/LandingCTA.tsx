import { Box, Container, Typography, Button } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { ctaGradient } from './landingTheme';
import type { SchoolTypeConfig } from './landingTypes';
import { glassSx, AmbientBlobs, Reveal } from './landingGlass';
import { easings } from '../../theme/motion';

interface LandingCTAProps {
  config: SchoolTypeConfig;
  schoolName?: string;
  schoolId?: string;
  isRoot?: boolean;
}

function QuranicCTA({ config, schoolName, schoolId }: LandingCTAProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <Box sx={{ py: 10, background: ctaGradient(config, isDark), position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs colors={[isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.3)', 'rgba(255,255,255,0.2)']} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box sx={glassSx(true, '#f59e0b', { radius: 4, blur: 28 })}>
            <Box sx={{ py: 8, px: { xs: 4, md: 8 }, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 900, mb: 2, color: isDark ? '#fbbf24' : '#92400e' }}>
                ﷽
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ color: isDark ? '#ffffff' : '#451a03', mb: 2 }}>
                {t('schoolLanding.quranicCta.title')}
              </Typography>
              <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(69,26,3,0.75)', mb: 5, maxWidth: 500, mx: 'auto', lineHeight: 1.8 }}>
                {t('schoolLanding.quranicCta.subtitle')}
              </Typography>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ duration: 0.15, ease: easings.spring }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login')}
                  sx={{
                    bgcolor: '#f59e0b',
                    color: '#1a0a00',
                    px: 6,
                    py: 2,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 32px rgba(245,158,11,0.35)',
                    '&:hover': {
                      bgcolor: '#fbbf24',
                      boxShadow: '0 12px 40px rgba(245,158,11,0.45)',
                    },
                  }}
                  endIcon={<LoginIcon />}
                >
                  {schoolName ? t('schoolLanding.loginToSchool', { name: schoolName }) : t('schoolLanding.quranicCta.action')}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}

function PrivateCTA({ config, schoolName, schoolId }: LandingCTAProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <Box sx={{ py: 10, background: ctaGradient(config, isDark), position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs colors={[isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.28)', 'rgba(255,255,255,0.2)']} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box sx={glassSx(isDark, config.accentColor, { radius: 4, blur: 26 })}>
            <Box sx={{ py: 8, px: { xs: 4, md: 8 }, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={800} sx={{ color: isDark ? '#ffffff' : '#1e1b4b', mb: 2 }}>
                {t('schoolLanding.privateCta.title')}
              </Typography>
              <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(30,27,75,0.75)', mb: 5, maxWidth: 500, mx: 'auto' }}>
                {t('schoolLanding.privateCta.subtitle')}
              </Typography>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ duration: 0.15, ease: easings.spring }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login')}
                  sx={{
                    bgcolor: 'white',
                    color: config.accentDark,
                    px: 6,
                    py: 2,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    border: isDark ? 'none' : '1px solid rgba(30,27,75,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    },
                  }}
                  endIcon={<ArrowIcon />}
                >
                  {schoolName ? t('schoolLanding.loginToSchool', { name: schoolName }) : t('landing.startNow')}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}

function KindergartenCTA({ config, schoolName, schoolId }: LandingCTAProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <Box sx={{ py: 10, background: ctaGradient(config, isDark), position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs colors={[isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.3)', 'rgba(251,191,36,0.25)']} />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '20%', right: '10%', fontSize: '3rem', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}
      >
        🌈
      </motion.div>
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ position: 'absolute', bottom: '20%', left: '10%', fontSize: '2.5rem', opacity: 0.2, pointerEvents: 'none', zIndex: 1 }}
      >
        ⭐
      </motion.div>
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box sx={glassSx(isDark, config.accentColor, { radius: 5, blur: 26 })}>
            <Box sx={{ py: 8, px: { xs: 4, md: 8 }, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 2, color: isDark ? '#fde68a' : '#047857' }}>
                {t('schoolLanding.kindergartenCta.title')}
              </Typography>
              <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(6,78,59,0.75)', mb: 5, maxWidth: 500, mx: 'auto' }}>
                {t('schoolLanding.kindergartenCta.subtitle')}
              </Typography>
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} transition={{ duration: 0.15, ease: easings.spring }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(schoolId ? `/s/${schoolId}/login` : '/superAdmin/login')}
                  sx={{
                    bgcolor: '#fde68a',
                    color: '#065f46',
                    px: 6,
                    py: 2,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 32px rgba(253,230,138,0.35)',
                    '&:hover': {
                      bgcolor: '#fcd34d',
                      boxShadow: '0 12px 40px rgba(253,230,138,0.45)',
                    },
                  }}
                  endIcon={<ArrowIcon />}
                >
                  {schoolName ? t('auth.login') : t('schoolLanding.kindergartenCta.action')}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}

export default function LandingCTA(props: LandingCTAProps) {
  const ctaMap = {
    quranic: QuranicCTA,
    private: PrivateCTA,
    kindergarten: KindergartenCTA,
  };
  const Component = ctaMap[props.config.ctaVariant];
  return <Component {...props} />;
}
