import { Box, Container, Typography, Grid, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import { glassSx, AmbientBlobs, Reveal, fluidStagger, fluidItem } from '../../../../components/landing/landingGlass';

export default function RootHowItWorks() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();

  const steps = [
    { num: '01', title: t('home.howItWorksSteps.createSchool.title'), desc: t('home.howItWorksSteps.createSchool.desc'), color: '#6366f1' },
    { num: '02', title: t('home.howItWorksSteps.addUsers.title'), desc: t('home.howItWorksSteps.addUsers.desc'), color: '#10b981' },
    { num: '03', title: t('home.howItWorksSteps.manageAndTrack.title'), desc: t('home.howItWorksSteps.manageAndTrack.desc'), color: '#f59e0b' },
  ];

  return (
    <Box sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.35)', position: 'relative', overflow: 'hidden', py: 12 }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.14)',
          isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.14)',
          isDark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.12)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip
              label={t('home.stepsChip')}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.12)',
                color: isDark ? 'rgba(255,255,255,0.85)' : '#047857',
                mb: 2,
                fontWeight: 700,
                backdropFilter: 'blur(10px)',
              }}
            />
            <Typography variant="h3" fontWeight={800} mb={1}>{t('landing.howItWorks')}</Typography>
            <Typography color="text.secondary">{t('home.howItWorksSubtitle')}</Typography>
          </Box>
        </Reveal>
        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <Grid container spacing={3}>
            {steps.map((s) => (
              <Grid key={s.num} size={{ xs: 12, md: 4 }}>
                <motion.div variants={fluidItem}>
                  <Box sx={glassSx(isDark, s.color, { radius: 3.5, interactive: true })}>
                    <Box sx={{ p: 4, height: '100%', textAlign: 'center' }}>
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ display: 'inline-block' }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2.5,
                            mx: 'auto',
                            bgcolor: `${s.color}${isDark ? '2E' : '1A'}`,
                            color: s.color,
                            boxShadow: isDark ? `0 10px 28px ${s.color}40` : `0 10px 28px ${s.color}2E`,
                          }}
                        >
                          <Typography variant="h5" fontWeight={800} sx={{ fontSize: '1.35rem' }}>
                            {s.num}
                          </Typography>
                        </Box>
                      </motion.div>
                      <Typography variant="h6" fontWeight={700} mb={1}>{s.title}</Typography>
                      <Typography color="text.secondary">{s.desc}</Typography>
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
