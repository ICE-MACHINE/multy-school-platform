import { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import DateRange from '@mui/icons-material/DateRange';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '../../../components/common/PageHeader';
import ChartCard from '../../../components/common/ChartCard';
import SegmentedControl from '../../../components/common/SegmentedControl';
import { useTranslation } from 'react-i18next';
import statsService from '../../../services/statsService';
import type { PlatformStats } from '../../../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    setLoading(true);
    statsService.getSuperAdminStats(period)
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, [period]);

  const userGrowth = stats?.userGrowth || [];
  const schoolTypes = stats?.schoolTypes || [];
  const revenueData = stats?.revenueData || [];

  return (
    <Box>
      <PageHeader title={t('titles.analytics')} subtitle={t('admin.analyticsSubtitle')}
        action={<SegmentedControl
          value={period}
          onChange={(v) => setPeriod(v)}
          options={[
            { value: 'week', label: t('common.week'), icon: <DateRange fontSize="small" /> },
            { value: 'month', label: t('common.month'), icon: <CalendarToday fontSize="small" /> },
            { value: 'year', label: t('admin.year'), icon: <CalendarMonth fontSize="small" /> },
          ]}
        />} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title={t('admin.userGrowth')} loading={loading} height={350} noData={userGrowth.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415520" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="teachers" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="parents" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title={t('admin.schoolTypes')} loading={loading} height={350} noData={schoolTypes.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={schoolTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                  {schoolTypes.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <ChartCard title={t('admin.revenueOverview')} loading={loading} height={300} noData={revenueData.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415520" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
