import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ChildIcon from '@mui/icons-material/ChildCare';
import PeopleIcon from '@mui/icons-material/People';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageShell from '../../../components/dashboard/PageShell';
import MetricCard from '../../../components/dashboard/MetricCard';
import DataCard from '../../../components/dashboard/DataCard';
import { useTranslation } from 'react-i18next';
import statsService from '../../../services/statsService';
import type { PlatformStats } from '../../../types';

const COLORS = ['#0f62fe', '#24a148', '#f1c21b', '#da1e28', '#1192e8', '#8a3ffc'];

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService.getSuperAdminStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monthlyRegistrations = stats?.monthlyRegistrations || [];
  const schoolTypes = stats?.schoolTypes || [];

  return (
    <PageShell title={t('common.dashboard')} subtitle={t('admin.platformOverview')}>
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('dashboard.totalSchools')} value={stats?.totalSchools ?? '—'} icon={<SchoolIcon />} color="#0f62fe" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('dashboard.totalStudents')} value={stats?.totalStudents ?? '—'} icon={<ChildIcon />} color="#24a148" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('dashboard.totalTeachers')} value={stats?.totalTeachers ?? '—'} icon={<PeopleIcon />} color="#f1c21b" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('dashboard.totalParents')} value={stats?.totalParents ?? '—'} icon={<FamilyIcon />} color="#1192e8" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DataCard title={t('admin.schoolRegistrations')} subtitle={t('admin.monthly')} loading={loading} noData={monthlyRegistrations.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRegistrations} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f62fe" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DataCard title={t('admin.schoolTypes')} loading={loading} noData={schoolTypes.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={schoolTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  isAnimationActive={false}
                  label={({ payload }) => `${payload.type}: ${payload.count}`}
                >
                  {schoolTypes.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
      </Grid>
    </PageShell>
  );
}
