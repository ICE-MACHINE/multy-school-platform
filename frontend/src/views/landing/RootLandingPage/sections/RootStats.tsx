import { Box, Container, Typography, Grid, Chip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import TeacherIcon from '@mui/icons-material/SupervisorAccount';
import CourseIcon from '@mui/icons-material/MenuBook';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import statsService from '../../../../services/statsService';
import type { PublicPlatformStats } from '../../../../types';
import { useCountUp } from '../../../../hooks/useCountUp';
import { glassSx, AmbientBlobs, fluidStagger, fluidItem } from '../../../../components/landing/landingGlass';
import { easings, durations } from '../../../../theme/motion';

const fallback: PublicPlatformStats = {
  totalSchools: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  totalClassrooms: 0,
  totalActivities: 0,
  schoolsByType: [],
};

export default function RootStats() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const [stats, setStats] = useState<PublicPlatformStats>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    statsService.getPublicPlatformStats()
      .then((data) => { if (active) setStats(data); })
      .catch(() => { if (active) setStats(fallback); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const items = [
    { value: stats.totalSchools, label: t('home.stats.managedSchool'), icon: <SchoolIcon sx={{ fontSize: 20 }} />, color: '#6366f1' },
    { value: stats.totalStudents, label: t('home.stats.trackedStudent'), icon: <GroupsIcon sx={{ fontSize: 20 }} />, color: '#10b981' },
    { value: stats.totalTeachers, label: t('home.stats.connectedTeacher'), icon: <TeacherIcon sx={{ fontSize: 20 }} />, color: '#f59e0b' },
    { value: stats.totalCourses, label: t('home.stats.educationalCourse'), icon: <CourseIcon sx={{ fontSize: 20 }} />, color: '#ec4899' },
  ];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', py: 12 }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.24)',
          isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.18)',
          isDark ? 'rgba(236,72,153,0.18)' : 'rgba(236,72,153,0.14)',
          isDark ? 'rgba(245,158,11,0.16)' : 'rgba(245,158,11,0.12)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: durations.slow / 1000, ease: easings.spring }}
        >
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip
              icon={<SchoolIcon sx={{ fontSize: 15 }} />}
              label={t('home.stats.chip')}
              sx={{
                bgcolor: `${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)'}`,
                color: isDark ? 'rgba(255,255,255,0.85)' : '#4338ca',
                mb: 2,
                fontWeight: 700,
                backdropFilter: 'blur(10px)',
              }}
            />
            <Typography variant="h3" fontWeight={800} mb={1}>
              {t('home.stats.title')}
            </Typography>
            <Typography color="text.secondary">{t('home.stats.subtitle')}</Typography>
          </Box>
        </motion.div>

        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <Grid container spacing={3}>
            {items.map((s) => (
              <Grid key={s.label} size={{ xs: 6, md: 3 }}>
                <motion.div variants={fluidItem}>
                  <Box sx={glassSx(isDark, s.color, { radius: 3.5, interactive: true })} my={2} py={3}>
                    <Box 
                    sx={{ display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2
                        }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        
                        mb: 2,
                        bgcolor: `${s.color}${isDark ? '33' : '1A'}`,
                        color: s.color,
                        boxShadow: isDark ? `0 8px 24px ${s.color}44` : `0 8px 24px ${s.color}33`,
                      }}
                    >
                      {s.icon}
                    </Box>
                    <StatValue value={s.value} color={s.color} ready={ready} />
                    </Box>
                    <Box sx={{
                       display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 600 }}>
                      {s.label}
                    </Typography>
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

function StatValue({ value, color, ready }: { value: number; color: string; ready: boolean }) {
  const { ref, display } = useCountUp(value, {
    duration: 1500,
    format: (n) => (n >= 1000 ? `${Math.round(n / 1000)}K+` : `${n}+`),
    start: ready,
  });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: easings.spring }}
      style={{
        color,
        fontWeight: 800,
        fontSize: 'clamp(1.9rem, 2.4rem, 2.4rem)',
        lineHeight: 1.1,
        display: 'inline-block',
        minHeight: '1.2em',
      }}
    >
      {ready ? display : '—'}
    </motion.span>
  );
}
