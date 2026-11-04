import { Box, Container, Typography, Chip, Grid } from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircle';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from './landingTheme';
import type { SchoolTypeConfig } from './landingTypes';
import type { PublicSchoolStats } from '../../types';
import statsService from '../../services/statsService';
import { glassSx, AmbientBlobs, Reveal, fluidStagger, fluidItem } from './landingGlass';
import { easings, durations } from '../../theme/motion';

interface LandingHighlightsProps {
  config: SchoolTypeConfig;
  schoolId?: string;
}

function useHighlightsColors(config: SchoolTypeConfig) {
  const { mode } = useTheme();
  return {
    isDark: mode === 'dark',
    colors: getLandingColors(config.highlightsVariant as LandingVariant, mode),
  };
}

function usePublicStats(schoolId?: string) {
  const [stats, setStats] = useState<PublicSchoolStats>({
    totalStudents: 0, totalTeachers: 0, totalCourses: 0, totalClassrooms: 0, totalActivities: 0,
  });
  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    statsService.getPublicSchoolStats(schoolId)
      .then((data) => { if (active) setStats(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [schoolId]);
  return stats;
}

function QuranicHighlights({ config }: LandingHighlightsProps) {
  const { isDark, colors } = useHighlightsColors(config);
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 10, bgcolor: colors.sectionBgAlt, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs colors={[isDark ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.14)']} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <Reveal x={-30}>
              <Chip label={t('schoolLanding.quranicHighlights.chip')} sx={{ bgcolor: `${config.accentColor}22`, color: config.accentColor, mb: 2, fontWeight: 600 }} />
              <Typography variant="h3" fontWeight={800} sx={{ color: colors.headingAccent, mb: 3, lineHeight: 1.2 }}>
                {t('schoolLanding.quranicHighlights.title')}
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, lineHeight: 1.8 }}>
                {t(config.aboutText)}
              </Typography>
            </Reveal>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
              <Grid container spacing={2}>
                {config.highlights.map((h, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6 }}>
                    <motion.div variants={fluidItem}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, ...glassSx(isDark, config.accentColor, { radius: 2, interactive: true }) }}>
                        <Box sx={{ color: config.accentColor, mt: 0.3, display: 'flex', fontSize: 20 }}>
                          {h.icon || <CheckIcon />}
                        </Box>
                        <Typography variant="body2" sx={{ color: colors.textPrimary, lineHeight: 1.7 }}>
                          {t(h.text)}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function PrivateHighlights({ config, schoolId }: LandingHighlightsProps) {
  const { isDark, colors } = useHighlightsColors(config);
  const { t } = useTranslation();
  const stats = usePublicStats(schoolId);
  return (
    <Box sx={{ py: 10, bgcolor: colors.sectionBgAlt, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs colors={[isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.14)']} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal x={-30}>
              <Chip label={t('schoolLanding.privateHighlights.chip')} sx={{ bgcolor: `${config.accentColor}22`, color: config.accentColor, mb: 2, fontWeight: 600 }} />
              <Typography variant="h3" fontWeight={800} sx={{ color: colors.textPrimary, mb: 3, lineHeight: 1.2 }}>
                {t('schoolLanding.privateHighlights.title')}
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 4, lineHeight: 1.8 }}>
                {t(config.aboutText)}
              </Typography>
              <Grid container spacing={2}>
                {config.highlights.map((h, i) => (
                  <Grid key={i} size={12}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: durations.normal / 1000, ease: easings.spring }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ color: config.accentColor, display: 'flex' }}>
                          {h.icon || <CheckIcon />}
                        </Box>
                        <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                          {t(h.text)}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Reveal>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Reveal x={30}>
              <Box sx={{ ...glassSx(isDark, config.accentColor, { radius: 4, blur: 26, interactive: true }) }}>
                <Box sx={{ p: 5, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)' }} />
                  <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.1)' }} />
                  <Typography variant="h1" sx={{ fontSize: '3.6rem', mb: 2, textAlign: 'center', position: 'relative' }}>📊</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ textAlign: 'center', mb: 3, position: 'relative' }}>
                    {t('schoolLanding.privateHighlights.cardTitle')}
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
                      borderRadius: 3,
                      p: 3,
                      backdropFilter: 'blur(12px)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)',
                      position: 'relative',
                    }}
                  >
                    {[
                      { label: t('schoolLanding.privateHighlights.enrolledStudents'), value: stats.totalStudents },
                      { label: t('schoolLanding.privateHighlights.teachers'), value: stats.totalTeachers },
                      { label: t('schoolLanding.privateHighlights.classrooms'), value: stats.totalClassrooms },
                      { label: t('schoolLanding.privateHighlights.courses'), value: stats.totalCourses },
                    ].map((item, i) => (
                      <Box key={item.label} display="flex" justifyContent="space-between" alignItems="center" mb={i < 3 ? 1.5 : 0}>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>{item.label}</Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: config.accentColor }}>
                          {item.value}+
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Reveal>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function KindergartenHighlights({ config }: LandingHighlightsProps) {
  const { isDark, colors } = useHighlightsColors(config);
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 10, bgcolor: colors.sectionBgAlt, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.14)',
          isDark ? 'rgba(251,191,36,0.14)' : 'rgba(251,191,36,0.1)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={6} sx={{ textAlign: 'center' }}>
            <Chip label={t('schoolLanding.kindergartenHighlights.chip')} sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: isDark ? '#34d399' : '#047857', mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: isDark ? '#fde68a' : '#047857', mb: 2 }}>
              {t('schoolLanding.kindergartenHighlights.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, maxWidth: 600, mx: 'auto' }}>
              {t('schoolLanding.kindergartenHighlights.subtitle')}
            </Typography>
          </Box>
        </Reveal>

        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
          <Grid container spacing={2.5}>
            {config.highlights.map((h, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div variants={fluidItem}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2.5,
                      ...glassSx(isDark, config.accentColor, { radius: 3.5, interactive: true }),
                      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: `${config.accentColor}${isDark ? '2E' : '1A'}`,
                        color: config.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {h.icon || <CheckIcon />}
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.textPrimary, lineHeight: 1.7 }}>
                      {t(h.text)}
                    </Typography>
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

export default function LandingHighlights(props: LandingHighlightsProps) {
  const highlightMap = {
    quranic: QuranicHighlights,
    private: PrivateHighlights,
    kindergarten: KindergartenHighlights,
  };
  const Component = highlightMap[props.config.highlightsVariant];
  return <Component {...props} />;
}
