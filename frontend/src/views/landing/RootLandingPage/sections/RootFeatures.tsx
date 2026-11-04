import { Box, Container, Typography, Grid, Chip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PaymentsIcon from '@mui/icons-material/Payments';
import QuranIcon from '@mui/icons-material/AutoStories';
import AttendanceIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import AnalyticsIcon from '@mui/icons-material/BarChart';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import { glassSx, AmbientBlobs, Reveal, fluidStagger, fluidItem } from '../../../../components/landing/landingGlass';

export default function RootFeatures() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();

  const features = [
    { icon: <SchoolIcon />, title: t('home.features.schoolManagement.title'), desc: t('home.features.schoolManagement.desc'), color: '#6366f1' },
    { icon: <PaymentsIcon />, title: t('home.features.paymentTracking.title'), desc: t('home.features.paymentTracking.desc'), color: '#10b981' },
    { icon: <QuranIcon />, title: t('home.features.quranicProgress.title'), desc: t('home.features.quranicProgress.desc'), color: '#f59e0b' },
    { icon: <AttendanceIcon />, title: t('home.features.attendanceSystem.title'), desc: t('home.features.attendanceSystem.desc'), color: '#3b82f6' },
    { icon: <MessageIcon />, title: t('home.features.messages.title'), desc: t('home.features.messages.desc'), color: '#ec4899' },
    { icon: <AnalyticsIcon />, title: t('home.features.analytics.title'), desc: t('home.features.analytics.desc'), color: '#8b5cf6' },
  ];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', py: 12 }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(99,102,241,0.24)' : 'rgba(99,102,241,0.2)',
          isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.14)',
          isDark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.12)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip
              label={t('landing.features')}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)',
                color: isDark ? 'rgba(255,255,255,0.85)' : '#4338ca',
                mb: 2,
                fontWeight: 700,
                backdropFilter: 'blur(10px)',
              }}
            />
            <Typography variant="h3" fontWeight={800} mb={1}>{t('home.featuresTitle')}</Typography>
            <Typography color="text.secondary">{t('home.featuresSubtitle')}</Typography>
          </Box>
        </Reveal>
        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div variants={fluidItem}>
                  <Box sx={glassSx(isDark, f.color, { radius: 3.5, interactive: true })}>
                    <Box sx={{ p: 4, height: '100%' }}>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Box
                          sx={{
                            width: 54,
                            height: 54,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2.5,
                            bgcolor: `${f.color}${isDark ? '2E' : '1A'}`,
                            color: f.color,
                            boxShadow: isDark ? `0 8px 22px ${f.color}3D` : `0 8px 22px ${f.color}2E`,
                          }}
                        >
                          {f.icon}
                        </Box>
                      </motion.div>
                      <Typography variant="h6" fontWeight={700} mb={1}>{f.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}
