import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Box, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import ChildIcon from '@mui/icons-material/ChildCare';
import PayIcon from '@mui/icons-material/Payments';
import CourseIcon from '@mui/icons-material/School';
import ClassroomIcon from '@mui/icons-material/Class';
import Cancel from '@mui/icons-material/Cancel';
import MailIcon from '@mui/icons-material/Mail';
import TrendingUp from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import ForumIcon from '@mui/icons-material/Forum';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageShell from '../../../components/dashboard/PageShell';
import MetricCard from '../../../components/dashboard/MetricCard';
import DataCard from '../../../components/dashboard/DataCard';
import UsageBar from '../../../components/dashboard/UsageBar';
import GlassCard from '../../../components/common/GlassCard';
import { useSchool } from '../../../hooks/useSchool';
import { useTranslation } from 'react-i18next';
import statsService from '../../../services/statsService';
import { useTimetableCleanup } from '../../../hooks/useTimetableCleanup';
import type { SchoolDashboardStats } from '../../../types';

const ATTENDANCE_COLORS: Record<string, string> = { present: '#24a148', absent: '#da1e28' };
const CHART_COLORS = ['#0f62fe', '#24a148', '#f1c21b', '#1192e8', '#da1e28', '#8a3ffc'];

export default function SchoolAdminDashboard() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { currentSchool, schoolType } = useSchool();
  const [stats, setStats] = useState<SchoolDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useTimetableCleanup();

  useEffect(() => {
    if (!schoolId) return;
    statsService.getSchoolStats(schoolId).then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, [schoolId]);

  const monthlyPaymentsData = stats?.monthlyPaymentsData || [];
  const attendanceData = stats ? [
    { name: t('attendance.present'), key: 'present', value: stats.todayAttendance.present },
    { name: t('attendance.absent'), key: 'absent', value: stats.todayAttendance.absent },
  ] : [];

  return (
    <PageShell title={t('common.dashboard')} subtitle={`${currentSchool?.name || schoolId} — ${t('admin.overview')}`}>
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title={t('nav.teachers')} value={stats?.totalTeachers ?? '—'} icon={<PeopleIcon />} color="#0f62fe" loading={loading} size="sm" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title={t('dashboard.totalParents')} value={stats?.totalParents ?? '—'} icon={<FamilyIcon />} color="#24a148" loading={loading} size="sm" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title={t('students.students')} value={stats?.totalStudents ?? '—'} icon={<ChildIcon />} color="#f1c21b" loading={loading} size="sm" />
        </Grid>
        {schoolType !== 'private' && (
          <Grid size={{ xs: 6, md: 3 }}>
            <MetricCard title={t('classrooms.classrooms')} value={stats?.totalClassrooms ?? '—'} icon={<ClassroomIcon />} color="#8a3ffc" loading={loading} size="sm" />
          </Grid>
        )}
        {schoolType === 'private' && (
          <Grid size={{ xs: 6, md: 3 }}>
            <MetricCard title={t('courses.courses')} value={stats?.totalCourses ?? '—'} icon={<CourseIcon />} color="#1192e8" loading={loading} size="sm" />
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title={t('admin.thisMonthRevenue')} value={stats?.monthlyPayments ? `${(stats.monthlyPayments).toLocaleString()} ${t('common.currency')}` : '—'} icon={<PayIcon />} color="#24a148" loading={loading} size="sm" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard title={t('admin.absentToday')} value={stats?.absentToday ?? '—'} icon={<Cancel />} color="#da1e28" loading={loading} size="sm" />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 3 }}>
              {t('admin.usageLimits')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2.5}>
              <UsageBar
                label={t('admin.users')}
                current={currentSchool?.currentUsers ?? 0}
                max={currentSchool?.maxUsers ?? 1}
                icon={<GroupIcon />}
              />
              <UsageBar
                label={t('schools.messages')}
                current={currentSchool?.currentMessages ?? 0}
                max={currentSchool?.maxMessages ?? 1}
                color="#24a148"
                icon={<ForumIcon />}
              />
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 2 }}>
              {t('admin.todayAttendance')}
            </Typography>
            {stats ? (
              <>
                <Box sx={{ position: 'relative', height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx="50%" cy="50%"
                        innerRadius={54}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {attendanceData.map((entry) => (
                          <Cell key={entry.name} fill={ATTENDANCE_COLORS[entry.key] ?? '#8d8d8d'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                      {stats.todayAttendance.rate}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('admin.attendanceRate')}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" justifyContent="center" gap={2.5} mt={1}>
                  {attendanceData.map((d) => (
                    <Box key={d.name} display="flex" alignItems="center" gap={0.75}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ATTENDANCE_COLORS[d.key] }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {d.name}: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{d.value}</Box>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('common.noData')}</Typography>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DataCard title={t('admin.monthlyPayments')} subtitle={t('admin.last12Months')} loading={loading} noData={monthlyPaymentsData.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPaymentsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="amount" fill="#0f62fe" radius={[6, 6, 0, 0]} name={t('payments.amount')} />
              </BarChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>
              {t('admin.quickStats')}
            </Typography>
            <Box display="flex" flexDirection="column">
              {[
                { label: t('admin.totalRevenue'), value: `${(stats?.totalPayments ?? 0).toLocaleString()} ${t('common.currency')}`, icon: <TrendingUp />, color: '#24a148' },
                { label: t('admin.thisMonthRevenue'), value: `${(stats?.monthlyPayments ?? 0).toLocaleString()} ${t('common.currency')}`, icon: <PayIcon />, color: '#1192e8' },
                { label: t('admin.absentToday'), value: stats?.absentToday ?? 0, icon: <Cancel />, color: '#da1e28' },
                { label: t('admin.totalMessages'), value: stats?.totalMessages ?? 0, icon: <MailIcon />, color: '#ff832b' },
                { label: t('dashboard.attendanceRate'), value: `${stats?.todayAttendance.rate ?? 0}%`, icon: <TrendingUp />, color: '#0f62fe' },
              ].map((item) => (
                <Box
                  key={item.label}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  py={1.25}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${item.color}1F`,
                        color: item.color,
                        '& .MuiSvgIcon-root': { fontSize: 16 },
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.8125rem' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <GlassCard sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>
            {t('admin.recentActivities')}
          </Typography>
          {stats.recentActivities.map((a: any, i: number) => (
            <Box
              key={a.id || i}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              py={1.5}
              sx={{ borderBottom: i < stats.recentActivities.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
            >
              <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length], opacity: 0.85, flexShrink: 0 }} />
                <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
                  {a.title}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                {new Date(a.date).toLocaleDateString()}
              </Typography>
            </Box>
          ))}
        </GlassCard>
      )}
    </PageShell>
  );
}
