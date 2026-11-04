import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Chip, Avatar, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem,
} from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppBadIcon from '@mui/icons-material/GppBad';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GavelIcon from '@mui/icons-material/Gavel';
import DataTable, { type Column } from '../../../../components/common/DataTable';
import StatsCard from '../../../../components/common/StatsCard';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import attendanceService from '../../../../services/attendanceService';
import { formatMonthKey } from '../../../../utils/arabicMonths';
import type { Attendance, Student } from '../../../../types';

const getPeriodLabels = (t: TFunction): Record<string, string> => ({ morning: t('attendance.morning'), afternoon: t('attendance.evening') });

const MONTH_OPTIONS: string[] = (() => {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
})();

export default function AttendanceSection({ student }: { student: Student }) {
  const { t } = useTranslation();
  const PERIOD_LABELS = getPeriodLabels(t);
  const { schoolId } = useParams<{ schoolId: string }>();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<{ totalDays: number; presentDays: number; absentDays: number; justifiedAbsences: number; unjustifiedAbsences: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [target, setTarget] = useState<Attendance | null>(null);
  const [justifyText, setJustifyText] = useState('');
  const [justifyLoading, setJustifyLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await attendanceService.getByStudent(schoolId, student.id, month || undefined);
      setRecords(res.data?.records || []);
      setSummary(res.data?.summary || null);
    } catch {} finally { setLoading(false); }
  }, [schoolId, student.id, month]);

  useEffect(() => { fetch(); }, [fetch]);

  const openJustify = (record: Attendance) => {
    setTarget(record);
    setJustifyText(record.justification || '');
  };

  const handleJustify = async () => {
    if (!schoolId || !target || !justifyText.trim()) return;
    setJustifyLoading(true);
    try {
      await attendanceService.justify(schoolId, target.id, justifyText.trim());
      setTarget(null);
      setJustifyText('');
      fetch();
    } catch {} finally { setJustifyLoading(false); }
  };

  const columns: Column<Attendance>[] = [
    { id: 'date', label: t('common.date'), sortable: false, accessor: (r) => <Typography fontWeight={600}>{new Date(r.date).toLocaleDateString()}</Typography> },
    { id: 'period', label: t('students.period'), sortable: false, accessor: (r) => <Chip size="small" variant="outlined" label={PERIOD_LABELS[r.period] || r.period} /> },
    {
      id: 'status', label: t('common.status'), sortable: false, accessor: (r) => (
        <Chip
          size="small"
          icon={r.isAbsent ? <CancelIcon /> : <CheckCircleIcon />}
          label={r.isAbsent ? t('attendance.absent') : t('attendance.present')}
          color={r.isAbsent ? 'error' : 'success'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'justified', label: t('attendance.justification'), sortable: false, accessor: (r) =>
        r.isAbsent ? (
          <Chip size="small" color={r.justified ? 'success' : 'warning'} label={r.justified ? t('attendance.justified') : t('attendance.unjustified')} />
        ) : (
          <Typography color="text.secondary">—</Typography>
        ),
    },
    { id: 'justification', label: t('common.reason'), sortable: false, accessor: (r) => r.justification || '-' },
    {
      id: 'actions', label: '', sortable: false, accessor: (r) =>
        r.isAbsent ? (
          <Button
            size="small"
            variant={r.justified ? 'text' : 'outlined'}
            startIcon={<GavelIcon />}
            onClick={(e) => { e.stopPropagation(); openJustify(r); }}
          >
            {r.justified ? t('common.edit') : t('attendance.justify')}
          </Button>
        ) : null,
    },
  ];

  const absentCount = records.filter((r) => r.isAbsent).length;

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('students.totalDays')} value={summary?.totalDays ?? 0} icon={<CheckCircleIcon />} color="#6366f1" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('students.absences')} value={summary?.absentDays ?? absentCount} icon={<EventBusyIcon />} color="#ef4444" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('attendance.justifiedAbsences')} value={summary?.justifiedAbsences ?? 0} icon={<VerifiedIcon />} color="#10b981" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('attendance.unjustifiedAbsences')} value={summary?.unjustifiedAbsences ?? 0} icon={<GppBadIcon />} color="#f59e0b" loading={loading} />
        </Grid>
      </Grid>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          select
          size="small"
          label={t('common.month')}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          sx={{ minWidth: 180 }}
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value="">{t('students.allMonths')}</MenuItem>
          {MONTH_OPTIONS.map((m) => <MenuItem key={m} value={m}>{formatMonthKey(m)}</MenuItem>)}
        </TextField>
        <Typography color="text.secondary" variant="body2">
          {t('students.justifyHint')}
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        data={records}
        keyExtractor={(r) => r.id}
        loading={loading}
        searchable={false}
        onRowClick={(r) => { if (r.isAbsent) openJustify(r); }}
        rowSx={(r) => ({
          cursor: r.isAbsent ? 'pointer' : 'default',
          bgcolor: r.isAbsent ? (r.justified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)') : undefined,
        })}
        emptyMessage={t('students.noAttendanceRecords')}
      />

      <Dialog open={!!target} onClose={() => setTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('attendance.justifyAbsence')}</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>{student.firstName[0]}</Avatar>
            <Box>
              <Typography fontWeight={600}>{student.firstName} {student.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {target ? `${new Date(target.date).toLocaleDateString()} — ${PERIOD_LABELS[target.period] || target.period}` : ''}
              </Typography>
            </Box>
          </Box>
          <TextField fullWidth multiline rows={3} label={t('attendance.justificationReason')} value={justifyText}
            onChange={(e) => setJustifyText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleJustify} disabled={justifyLoading || !justifyText.trim()}>
            {justifyLoading ? t('attendance.justifying') : t('attendance.justify')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
