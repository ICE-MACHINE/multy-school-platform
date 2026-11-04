import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Chip, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, MenuItem, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppBadIcon from '@mui/icons-material/GppBad';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import WbSunny from '@mui/icons-material/WbSunny';
import Nightlight from '@mui/icons-material/Nightlight';
import PageHeader from '../../../components/common/PageHeader';
import SegmentedControl from '../../../components/common/SegmentedControl';
import FilterRow from '../../../components/common/FilterBar';
import { pillFieldSx } from '../../../components/common/filterStyles';
import DataTable, { type Column } from '../../../components/common/DataTable';
import StatsCard from '../../../components/common/StatsCard';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import attendanceService, { type AttendanceSummary } from '../../../services/attendanceService';
import CourseAttendanceAdminPage from './CourseAttendanceAdminPage';
import { useSchool } from '../../../hooks/useSchool';
import type { Attendance, ActivityPeriod } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';

const getPeriodLabels = (t: TFunction): Record<string, string> => ({ morning: t('attendance.morning'), afternoon: t('attendance.evening') });
const TODAY = new Date().toISOString().split('T')[0];

export default function AdminAttendancePage() {
  const { schoolType } = useSchool();
  return schoolType === 'private' ? <CourseAttendanceAdminPage /> : <LegacyAdminAttendancePage />;
}

function LegacyAdminAttendancePage() {
  const { t } = useTranslation();
  const PERIOD_LABELS = getPeriodLabels(t);
  const { schoolId } = useParams<{ schoolId: string }>();
  const [tab, setTab] = useState(0);

  const [date, setDate] = useState(TODAY);
  const [period, setPeriod] = useState<ActivityPeriod>('morning');
  const [dailyRecords, setDailyRecords] = useState<Attendance[]>([]);
  const [dailySummary, setDailySummary] = useState<AttendanceSummary | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [justification, setJustification] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [justifyTarget, setJustifyTarget] = useState<Attendance | null>(null);
  const [justifyText, setJustifyText] = useState('');
  const [justifyLoading, setJustifyLoading] = useState(false);

  const fetchDaily = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [att, summ] = await Promise.all([
        attendanceService.getByDate(schoolId, date, period),
        attendanceService.getSummary(schoolId, { date, period }),
      ]);
      setDailyRecords(att.data || []);
      setDailySummary(summ.data);
    } catch {} finally { setLoading(false); }
  }, [schoolId, date, period]);

  const fetchAbsences = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const range = {
        from: fromDate || undefined,
        to: toDate || undefined,
      };
      const filters: Record<string, string | undefined> = { ...range, isAbsent: 'true' };
      if (justification) filters.justified = justification;
      const [att, summ] = await Promise.all([
        attendanceService.getAll(schoolId, { ...filters, search: debouncedSearch }, page + 1, rowsPerPage),
        attendanceService.getSummary(schoolId, range),
      ]);
      setRecords(att.data || []);
      setTotal(att.pagination?.total || 0);
      setSummary(summ.data);
    } catch {} finally { setLoading(false); }
  }, [schoolId, fromDate, toDate, justification, debouncedSearch, page, rowsPerPage]);

  useEffect(() => { if (tab === 0) fetchDaily(); }, [fetchDaily, tab]);
  useEffect(() => { if (tab === 1) fetchAbsences(); }, [fetchAbsences, tab]);

  const handleJustify = async () => {
    if (!schoolId || !justifyTarget || !justifyText.trim()) return;
    setJustifyLoading(true);
    try {
      await attendanceService.justify(schoolId, justifyTarget.id, justifyText.trim());
      setJustifyTarget(null);
      setJustifyText('');
      if (tab === 0) fetchDaily(); else fetchAbsences();
    } catch {} finally { setJustifyLoading(false); }
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setJustification('');
    setSearch('');
    setPage(0);
  };

  const studentCell = (r: Attendance) => (
    <Box display="flex" alignItems="center" gap={1}>
      <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: r.isAbsent ? 'error.main' : 'success.main' }}>{r.student?.firstName?.[0]}</Avatar>
      <Box>
        <Typography variant="body2" fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
        {r.student?.registrationNumber && <Typography variant="caption" color="text.secondary">{r.student.registrationNumber}</Typography>}
      </Box>
    </Box>
  );

  const statusCell = (r: Attendance) => (
    <Chip
      size="small"
      icon={r.isAbsent ? <Cancel /> : <CheckCircle />}
      label={r.isAbsent ? t('attendance.absent') : t('attendance.present')}
      color={r.isAbsent ? 'error' : 'success'}
      variant="outlined"
    />
  );

  const justificationCell = (r: Attendance) =>
    r.isAbsent ? (
      <Chip size="small" color={r.justified ? 'success' : 'warning'} label={r.justified ? t('attendance.justified') : t('attendance.unjustified')} />
    ) : (
      <Typography color="text.secondary">—</Typography>
    );

  const actionsCell = (r: Attendance) =>
    r.isAbsent ? (
      <Button
        size="small"
        variant={r.justified ? 'text' : 'outlined'}
        startIcon={<VerifiedIcon />}
        onClick={() => { setJustifyTarget(r); setJustifyText(r.justification || ''); }}
      >
        {r.justified ? t('common.edit') : t('attendance.justify')}
      </Button>
    ) : null;

  const dailyColumns: Column<Attendance>[] = [
    { id: 'student', label: t('students.student'), sortable: false, accessor: studentCell },
    { id: 'period', label: t('students.period'), sortable: false, accessor: (r) => <Chip size="small" variant="outlined" label={PERIOD_LABELS[r.period] || r.period} /> },
    { id: 'status', label: t('common.status'), sortable: false, accessor: statusCell },
    { id: 'justified', label: t('attendance.justification'), sortable: false, accessor: justificationCell },
    { id: 'justification', label: t('common.reason'), sortable: false, accessor: (r) => r.justification || '-' },
    { id: 'actions', label: '', sortable: false, accessor: actionsCell },
  ];

  const absenceColumns: Column<Attendance>[] = [
    { id: 'student', label: t('students.student'), sortable: false, accessor: studentCell },
    { id: 'date', label: t('common.date'), sortable: false, accessor: (r) => new Date(r.date).toLocaleDateString() },
    { id: 'period', label: t('students.period'), sortable: false, accessor: (r) => <Chip size="small" variant="outlined" label={PERIOD_LABELS[r.period] || r.period} /> },
    { id: 'justified', label: t('attendance.justification'), sortable: false, accessor: justificationCell },
    { id: 'justification', label: t('common.reason'), sortable: false, accessor: (r) => r.justification || '-' },
    { id: 'actions', label: '', sortable: false, accessor: actionsCell },
  ];

  return (
    <Box>
      <PageHeader title={t('students.attendanceTitle')} subtitle={t('students.attendanceSubtitle')} />

      <Box sx={{ mb: 3 }}>
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v)}
          options={[
            { value: 0, label: t('students.dailyAttendance'), icon: <EventAvailableIcon fontSize="small" /> },
            { value: 1, label: t('students.totalAbsencesTitle'), icon: <EventBusyIcon fontSize="small" /> },
          ]}
        />
      </Box>

      {tab === 0 ? (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('students.presentCount')} value={dailySummary?.presentCount ?? 0} icon={<CheckCircle />} color="#10b981" loading={loading} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('students.absentCountLabel')} value={dailySummary?.absentCount ?? 0} icon={<Cancel />} color="#ef4444" loading={loading} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('dashboard.attendanceRate')} value={`${dailySummary?.attendanceRate ?? 0}%`} icon={<EventAvailableIcon />} color="#6366f1" loading={loading} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('students.totalRegistered')} value={dailySummary?.totalRecords ?? 0} icon={<EventBusyIcon />} color="#f59e0b" loading={loading} />
            </Grid>
          </Grid>

          <FilterRow>
            <TextField
              type="date"
              size="small"
              label={t('common.date')}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 160, ...pillFieldSx }}
            />
            <SegmentedControl
              value={period}
              onChange={(v) => setPeriod(v)}
              options={[
                { value: 'morning', label: t('attendance.morning'), icon: <WbSunny fontSize="small" /> },
                { value: 'afternoon', label: t('attendance.evening'), icon: <Nightlight fontSize="small" /> },
              ]}
            />
            <Chip
              label={t('students.absentOfTotal', { absent: dailySummary?.absentCount ?? 0, total: dailySummary?.totalRecords ?? 0 })}
              color={(dailySummary?.absentCount ?? 0) > 0 ? 'warning' : 'success'}
              variant="outlined"
              sx={{ ml: 'auto', fontWeight: 600 }}
            />
          </FilterRow>

          <DataTable
            columns={dailyColumns}
            data={dailyRecords}
            keyExtractor={(r) => r.id}
            loading={loading}
            searchable={false}
            emptyMessage={t('students.noAttendanceToday')}
          />
        </>
      ) : (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('students.totalAbsencesTitle')} value={summary?.absentCount ?? 0} icon={<EventBusyIcon />} color="#ef4444" loading={loading} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('attendance.justifiedAbsences')} value={summary?.justifiedAbsences ?? 0} icon={<VerifiedIcon />} color="#10b981" loading={loading} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('attendance.unjustifiedAbsences')} value={summary?.unjustifiedAbsences ?? 0} icon={<GppBadIcon />} color="#f59e0b" loading={loading} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard title={t('dashboard.attendanceRate')} value={`${summary?.attendanceRate ?? 0}%`} icon={<CheckCircle />} color="#6366f1" loading={loading} />
            </Grid>
          </Grid>

          <FilterRow>
            <TextField
              type="date"
              size="small"
              label={t('students.fromDate')}
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, ...pillFieldSx }}
            />
            <TextField
              type="date"
              size="small"
              label={t('students.toDate')}
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 150, ...pillFieldSx }}
            />
            <TextField
              select
              size="small"
              label={t('attendance.justification')}
              value={justification}
              onChange={(e) => { setJustification(e.target.value); setPage(0); }}
              sx={{ minWidth: 150, ...pillFieldSx }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">{t('students.allStatuses')}</MenuItem>
              <MenuItem value="true">{t('attendance.justified')}</MenuItem>
              <MenuItem value="false">{t('attendance.unjustified')}</MenuItem>
            </TextField>
            <TextField
              size="small"
              placeholder={t('students.searchStudent')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ flexGrow: 1, minWidth: 200, ...pillFieldSx }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                },
              }}
            />
            <Tooltip title={t('students.clearFilters')}>
              <IconButton onClick={clearFilters} disabled={!fromDate && !toDate && !justification && !search}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </FilterRow>

          <DataTable
            columns={absenceColumns}
            data={records}
            keyExtractor={(r) => r.id}
            loading={loading}
            searchable={false}
            rowSx={(r) => (r.justified ? { bgcolor: 'rgba(16, 185, 129, 0.04)' } : {})}
            emptyMessage={t('students.noMatchingAbsences')}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={total}
            onPageChange={(p) => setPage(p)}
            onRowsPerPageChange={(l) => { setRowsPerPage(l); setPage(0); }}
          />
        </>
      )}

      <Dialog open={!!justifyTarget} onClose={() => setJustifyTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('attendance.justifyAbsence')}</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>{justifyTarget?.student?.firstName?.[0]}</Avatar>
            <Box>
              <Typography fontWeight={600}>{justifyTarget?.student?.firstName} {justifyTarget?.student?.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {justifyTarget ? `${new Date(justifyTarget.date).toLocaleDateString()} — ${PERIOD_LABELS[justifyTarget.period] || justifyTarget.period}` : ''}
              </Typography>
            </Box>
          </Box>
          <TextField fullWidth multiline rows={3} label={t('attendance.justificationReason')} value={justifyText}
            onChange={(e) => setJustifyText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJustifyTarget(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleJustify} disabled={justifyLoading || !justifyText.trim()}>
            {justifyLoading ? t('attendance.justifying') : t('attendance.justify')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
