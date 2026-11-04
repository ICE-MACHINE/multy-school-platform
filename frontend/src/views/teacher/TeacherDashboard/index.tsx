import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid } from '@mui/material';
import StudentsIcon from '@mui/icons-material/ChildCare';
import PresentIcon from '@mui/icons-material/CheckCircle';
import AbsentIcon from '@mui/icons-material/Cancel';
import RateIcon from '@mui/icons-material/Insights';
import ProgressIcon from '@mui/icons-material/TrendingUp';
import QuranIcon from '@mui/icons-material/MenuBook';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import PageShell from '../../../components/dashboard/PageShell';
import MetricCard from '../../../components/dashboard/MetricCard';
import DataCard from '../../../components/dashboard/DataCard';
import statsService from '../../../services/statsService';
import { useSchool } from '../../../hooks/useSchool';
import type { TeacherDashboardStats } from '../../../types';
import { useTranslation } from 'react-i18next';


const PROGRESS_COLORS: Record<string, string> = {
  محفوظة: '#24a148',
  ملقنة: '#f1c21b',
  'لم يصل لها': '#8d8d8d',
};
const LESSON_COLORS: Record<string, string> = {
  'حضر': '#24a148',
  'غاب': '#da1e28',
  'لم يصل': '#8d8d8d',
};
const GENDER_COLORS = ['#0f62fe', '#ee5396'];

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { schoolType } = useSchool();
  const isQuranic = schoolType === 'quranic';
  const isKindergarten = schoolType === 'kindergarten';
  const progressNoun = isKindergarten ? t('teacher.activitiesNoun') : t('teacher.lessonsNoun');
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) statsService.getTeacherStats(schoolId).then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, [schoolId]);

  const today = stats?.todayStats;
  const distribution = (isQuranic ? stats?.progressDistribution : stats?.lessonDistribution) || [];
  const monthlyAttendance = stats?.monthlyAttendance || [];
  const genderDistribution = stats?.genderDistribution || [];
  const ageDistribution = stats?.ageDistribution || [];
  const hasMonthlyAttendance = monthlyAttendance.length > 0 && monthlyAttendance.some((m) => m.present > 0 || m.absent > 0);

  return (
    <PageShell
      title={t('titles.teacherDashboard')}
      subtitle={
        stats?.assignedCourse?.name
          ? t('teacher.overviewCourse', { name: stats.assignedCourse.name, count: stats.totalStudents })
          : stats?.assignedClassroom?.name
            ? t('teacher.overviewClassroom', { name: stats.assignedClassroom.name, count: stats.totalStudents })
            : t('teacher.overviewAssigned')
      }
    >
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('teacher.myStudents')} value={stats?.totalStudents ?? '—'} icon={<StudentsIcon />} color="#0f62fe" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('dashboard.presentToday')} value={today?.present ?? '—'} icon={<PresentIcon />} color="#24a148" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('dashboard.absentToday')} value={today?.absent ?? '—'} icon={<AbsentIcon />} color="#da1e28" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('teacher.overallAttendanceRate')} value={typeof stats?.attendanceRate === 'number' ? `${stats.attendanceRate}%` : '—'} icon={<RateIcon />} color="#8a3ffc" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DataCard
            title={isQuranic ? t('teacher.memorizationDistribution') : t('teacher.lessonsDistribution', { noun: progressNoun })}
            subtitle={isQuranic ? t('teacher.memorizationSubtitle') : t('teacher.lessonsSubtitle', { noun: progressNoun })}
            loading={loading}
            noData={distribution.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={42}
                  paddingAngle={2}
                >
                  {distribution.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={isQuranic ? (PROGRESS_COLORS[entry.status] || '#8d8d8d') : (LESSON_COLORS[entry.status] || '#8d8d8d')}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DataCard
            title={t('teacher.monthlyAttendance')}
            subtitle={t('teacher.last6Months')}
            loading={loading}
            noData={!hasMonthlyAttendance}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAttendance} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar name={t('attendance.present')} dataKey="present" stackId="a" fill="#24a148" radius={[0, 0, 0, 0]} />
                <Bar name={t('attendance.absent')} dataKey="absent" stackId="a" fill="#da1e28" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DataCard title={t('teacher.genderDistribution')} subtitle={t('teacher.malesAndFemales')} loading={loading} noData={genderDistribution.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={42}
                  paddingAngle={2}
                >
                  {genderDistribution.map((entry, i) => (
                    <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DataCard title={t('teacher.ageDistribution')} subtitle={t('teacher.byAgeGroup')} loading={loading} noData={ageDistribution.every((a) => a.count === 0)}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="count" name={t('teacher.studentCount')} fill="#0f62fe" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard size="sm" title={t('teacher.averageProgress')} value={typeof stats?.avgProgress === 'number' ? `${stats.avgProgress}%` : '—'} icon={<ProgressIcon />} color="#f1c21b" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {isQuranic ? (
            <MetricCard size="sm" title={t('teacher.totalMemorizedSurahs')} value={stats?.totalMemorizedSurahs ?? '—'} icon={<QuranIcon />} color="#24a148" loading={loading} />
          ) : (
            <MetricCard size="sm" title={t('teacher.totalAttended', { noun: progressNoun })} value={stats?.totalLessonsAttended ?? '—'} icon={<QuranIcon />} color="#24a148" loading={loading} />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {isQuranic ? (
            <MetricCard size="sm" title={t('teacher.averageMemorizedPerStudent')} value={typeof stats?.avgMemorizedSurahs === 'number' ? stats.avgMemorizedSurahs : '—'} icon={<PresentIcon />} color="#0f62fe" loading={loading} />
          ) : (
            <MetricCard size="sm" title={t('teacher.averageAttendedPerStudent', { noun: progressNoun })} value={typeof stats?.avgLessonsPerStudent === 'number' ? stats.avgLessonsPerStudent : '—'} icon={<PresentIcon />} color="#0f62fe" loading={loading} />
          )}
        </Grid>
      </Grid>
    </PageShell>
  );
}
