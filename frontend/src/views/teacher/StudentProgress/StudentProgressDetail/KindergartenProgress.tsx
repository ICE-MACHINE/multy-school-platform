import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useParams } from 'react-router-dom';
import activityService from '../../../../services/activityService';
import type { Student, StudentActivityProgress, ActivityPeriod, ActivityCategory } from '../../../../types';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const categoryLabel = (t: TFunction, c: ActivityCategory) => t(`activities.${c}`);
const periodLabel = (t: TFunction, p: ActivityPeriod) => t(`activities.${p}`);

interface ProgressData {
  totalActivities: number;
  completedActivities: number;
  missedActivities: number;
  plannedActivities: number;
  records: StudentActivityProgress[];
}

function StatusChip({ record }: { record: StudentActivityProgress }) {
  const { t } = useTranslation();
  if (record.status === 'planned') {
    return <Chip size="small" variant="outlined" label={t('activities.notDoneYet')} />;
  }
  if (record.participated) {
    return <Chip size="small" color="success" label={t('activities.attendedIt')} />;
  }
  return <Chip size="small" color="error" variant="outlined" label={t('activities.missedIt')} />;
}

export default function KindergartenProgress({ student }: { student: Student }) {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    activityService.getStudentProgress(schoolId, student.id)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [schoolId, student.id]);

  if (loading) {
    return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  }

  if (!data || data.records.length === 0) {
    return <Typography color="text.secondary">{t('progress.noActivitiesForStudent')}</Typography>;
  }

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h3" fontWeight={800} color="primary.main">{data.totalActivities}</Typography>
            <Typography color="text.secondary">{t('activities.activitiesCount')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h3" fontWeight={800} color="success.main">{data.completedActivities}</Typography>
            <Typography color="text.secondary">{t('activities.attendedActivities')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h3" fontWeight={800} color="error.main">{data.missedActivities}</Typography>
            <Typography color="text.secondary">{t('activities.missedActivities')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h3" fontWeight={800} color="text.secondary">{data.plannedActivities}</Typography>
            <Typography color="text.secondary">{t('activities.notCompletedYet')}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{t('parent.activity')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.type')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.description')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.date')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('activities.period')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.records.map((r) => (
              <TableRow key={r.activity.id}>
                <TableCell><Typography fontWeight={600}>{r.activity.title}</Typography></TableCell>
                <TableCell>{categoryLabel(t, r.activity.category) || r.activity.category}</TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  {r.activity.description || <Typography color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell>{r.activity.date}</TableCell>
                <TableCell>{periodLabel(t, r.activity.period)}</TableCell>
                <TableCell>
                  <StatusChip record={r} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
