import { Box, Container, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import QuranIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import TeacherIcon from '@mui/icons-material/SupervisorAccount';
import CourseIcon from '@mui/icons-material/MenuBook';
import ClassroomIcon from '@mui/icons-material/School';
import ActivityIcon from '@mui/icons-material/Palette';
import ChildIcon from '@mui/icons-material/ChildCare';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useTheme } from '../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from './landingTheme';
import type { SchoolTypeConfig, StatItem } from './landingTypes';
import type { PublicSchoolStats } from '../../types';
import statsService from '../../services/statsService';
import { useCountUp } from '../../hooks/useCountUp';
import { glassSx, fluidStagger, fluidItem } from './landingGlass';
import { easings } from '../../theme/motion';

interface LandingStatsBarProps {
  config: SchoolTypeConfig;
  schoolId?: string;
}

const statCardRadii: Record<string, number> = {
  quranic: 3,
  private: 3.5,
  kindergarten: 5,
};

const emptyStats: PublicSchoolStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  totalClassrooms: 0,
  totalActivities: 0,
};

export default function LandingStatsBar({ config, schoolId }: LandingStatsBarProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const colors = getLandingColors(config.statsVariant as LandingVariant, mode);
  const radius = statCardRadii[config.statsVariant];
  const [stats, setStats] = useState<PublicSchoolStats>(emptyStats);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    statsService.getPublicSchoolStats(schoolId)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setStats(emptyStats);
      })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [schoolId]);

  const items: StatWithFixed[] = buildStatItems(config, stats, t);

  return (
    <Box sx={{ position: 'relative', zIndex: 2, marginTop: '-46px' }}>
      <Container maxWidth="lg">
        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
          <Grid container spacing={2.5}>
            {items.map((stat, i) => (
              <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                <motion.div variants={fluidItem}>
                  <Box sx={glassSx(isDark, stat.color, { radius, interactive: true })}>
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: easings.spring }}
                        style={{ display: 'inline-block' }}
                      >
                        <Box
                          sx={{
                            bgcolor: `${stat.color}${isDark ? '2E' : '1A'}`,
                            color: stat.color,
                            width: 48,
                            height: 48,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 1.5,
                            boxShadow: isDark ? `0 8px 20px ${stat.color}3D` : `0 8px 20px ${stat.color}2E`,
                          }}
                        >
                          {stat.icon}
                        </Box>
                      </motion.div>
                      <StatValue value={stat.value} numeric={stat.numeric} color={stat.color} ready={ready} isFixed={stat.fixed} />
                      <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5, fontWeight: 600 }}>
                        {stat.label}
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

interface StatWithFixed extends StatItem {
  fixed?: boolean;
  numeric?: number;
}

function buildStatItems(config: SchoolTypeConfig, stats: PublicSchoolStats, t: TFunction): StatWithFixed[] {
  const { totalStudents, totalTeachers, totalCourses, totalClassrooms, totalActivities } = stats;
  const base = {
    icon: <GroupsIcon sx={{ fontSize: 20 }} />,
    color: config.accentColor,
  };

  if (config.id === 'quranic') {
    return [
      { ...base, label: t('schoolLanding.quranic.stats.surahsTracked'), value: '114', numeric: 114, fixed: true, icon: <QuranIcon sx={{ fontSize: 20 }} />, color: '#f59e0b' },
      { ...base, label: t('schoolLanding.quranic.stats.studentEnrolled'), value: `${totalStudents}+`, numeric: totalStudents, icon: <GroupsIcon sx={{ fontSize: 20 }} />, color: '#d97706' },
      { ...base, label: t('schoolLanding.quranic.stats.quranTeacher'), value: `${totalTeachers}+`, numeric: totalTeachers, icon: <TeacherIcon sx={{ fontSize: 20 }} />, color: '#f59e0b' },
      { ...base, label: t('schoolLanding.quranic.stats.halaqaClass'), value: `${totalClassrooms}+`, numeric: totalClassrooms, icon: <ClassroomIcon sx={{ fontSize: 20 }} />, color: '#b45309' },
    ];
  }
  if (config.id === 'kindergarten') {
    return [
      { ...base, label: t('schoolLanding.kindergarten.stats.childEnrolled'), value: `${totalStudents}+`, numeric: totalStudents, icon: <ChildIcon sx={{ fontSize: 20 }} />, color: '#10b981' },
      { ...base, label: t('schoolLanding.kindergarten.stats.educator'), value: `${totalTeachers}+`, numeric: totalTeachers, icon: <TeacherIcon sx={{ fontSize: 20 }} />, color: '#059669' },
      { ...base, label: t('schoolLanding.kindergarten.stats.section'), value: `${totalClassrooms}+`, numeric: totalClassrooms, icon: <ClassroomIcon sx={{ fontSize: 20 }} />, color: '#10b981' },
      { ...base, label: t('schoolLanding.kindergarten.stats.educationalActivity'), value: `${totalActivities}+`, numeric: totalActivities, icon: <ActivityIcon sx={{ fontSize: 20 }} />, color: '#047857' },
    ];
  }
  return [
    { ...base, label: t('schoolLanding.private.stats.studentEnrolled'), value: `${totalStudents}+`, numeric: totalStudents, icon: <GroupsIcon sx={{ fontSize: 20 }} />, color: '#6366f1' },
    { ...base, label: t('schoolLanding.private.stats.qualifiedTeacher'), value: `${totalTeachers}+`, numeric: totalTeachers, icon: <TeacherIcon sx={{ fontSize: 20 }} />, color: '#4f46e5' },
    { ...base, label: t('schoolLanding.private.stats.classroom'), value: `${totalClassrooms}+`, numeric: totalClassrooms, icon: <ClassroomIcon sx={{ fontSize: 20 }} />, color: '#6366f1' },
    { ...base, label: t('schoolLanding.private.stats.subject'), value: `${totalCourses}+`, numeric: totalCourses, icon: <CourseIcon sx={{ fontSize: 20 }} />, color: '#4338ca' },
  ];
}

function StatValue({ value, numeric, color, ready, isFixed }: { value: string; numeric?: number; color: string; ready: boolean; isFixed?: boolean }) {
  const { ref, display } = useCountUp(isFixed ? 0 : (numeric ?? 0), {
    duration: 1400,
    format: (n) => `${n}+`,
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
        fontSize: 'clamp(1.6rem, 2rem, 2rem)',
        lineHeight: 1.2,
        display: 'inline-block',
        minHeight: '1.25em',
      }}
    >
      {ready ? (isFixed ? value : display) : '—'}
    </motion.span>
  );
}
