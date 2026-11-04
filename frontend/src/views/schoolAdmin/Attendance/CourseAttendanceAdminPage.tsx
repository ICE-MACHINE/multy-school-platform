import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Chip, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, MenuItem, InputAdornment, IconButton, Tooltip, Alert,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppBadIcon from '@mui/icons-material/GppBad';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import PageHeader from '../../../components/common/PageHeader';
import FilterRow from '../../../components/common/FilterBar';
import { pillFieldSx } from '../../../components/common/filterStyles';
import SegmentedControl from '../../../components/common/SegmentedControl';
import DataTable, { type Column } from '../../../components/common/DataTable';
import StatsCard from '../../../components/common/StatsCard';
import { useTranslation } from 'react-i18next';
import courseService from '../../../services/courseService';
import courseAttendanceService from '../../../services/courseAttendanceService';
import type { CourseAttendance, CourseAttendanceSummary, Course } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';

const TODAY = new Date().toISOString().split('T')[0];

export default function CourseAttendanceAdminPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [tab, setTab] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');

  const [date, setDate] = useState(TODAY);
  const [dailyRecords, setDailyRecords] = useState<CourseAttendance[]>([]);
  const [dailySummary, setDailySummary] = useState<CourseAttendanceSummary | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [justification, setJustification] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [records, setRecords] = useState<CourseAttendance[]>([]);
  const [summary, setSummary] = useState<CourseAttendanceSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [justifyTarget, setJustifyTarget] = useState<CourseAttendance | null>(null);
  const [justifyText, setJustifyText] = useState('');
  const [justifyLoading, setJustifyLoading] = useState(false);

  useEffect(() => {
    if (schoolId) {
      courseService.getAll(schoolId).then((res) => {
        const list = res.data || [];
        setCourses(list);
        if (list.length && !courseId) setCourseId(list[0].id);
      });
    }
  }, [schoolId]);

  const fetchDaily = useCallback(async () => {
    if (!schoolId || !courseId) return;
    setLoading(true);
    setError('');
    try {
      const filters = { date };
      const [att, summ] = await Promise.all([
        courseAttendanceService.getByCourse(schoolId, courseId, filters, 1, 200),
        courseAttendanceService.getSummary(schoolId, courseId, filters),
      ]);
      setDailyRecords(att.data || []);
      setDailySummary(summ.data);
    } catch (e: any) { setError(e?.response?.data?.message || t('students.failedLoadAttendance')); }
    finally { setLoading(false); }
  }, [schoolId, courseId, date]);

  const fetchAbsences = useCallback(async () => {
    if (!schoolId || !courseId) return;
    setLoading(true);
    setError('');
    try {
      const range = { from: fromDate || undefined, to: toDate || undefined };
      const filters: Record<string, string | undefined> = { ...range, isAbsent: 'true' };
      if (justification) filters.justified = justification;
      const [att, summ] = await Promise.all([
        courseAttendanceService.getByCourse(schoolId, courseId, { ...filters, search: debouncedSearch }, page + 1, rowsPerPage),
        courseAttendanceService.getSummary(schoolId, courseId, range),
      ]);
      setRecords(att.data || []);
      setTotal(att.pagination?.total || 0);
      setSummary(summ.data);
    } catch (e: any) { setError(e?.response?.data?.message || t('students.failedLoadAbsences')); }
    finally { setLoading(false); }
  }, [schoolId, courseId, fromDate, toDate, justification, debouncedSearch, page, rowsPerPage]);

  useEffect(() => { if (tab === 0 && courseId) fetchDaily(); }, [fetchDaily, tab, courseId]);
  useEffect(() => { if (tab === 1 && courseId) fetchAbsences(); }, [fetchAbsences, tab, courseId]);

  const toggleStatus = async (record: CourseAttendance) => {
    if (!schoolId || !courseId) return;
    try {
      await courseAttendanceService.update(schoolId, courseId, record.id, { isAbsent: !record.isAbsent });
      if (tab === 0) fetchDaily(); else fetchAbsences();
    } catch (e: any) { setError(e?.response?.data?.message || t('students.failedUpdateStatus')); }
  };

  const handleJustify = async () => {
    if (!schoolId || !courseId || !justifyTarget || !justifyText.trim()) return;
    setJustifyLoading(true);
    try {
      await courseAttendanceService.justify(schoolId, courseId, justifyTarget.id, justifyText.trim());
      setJustifyTarget(null);
      setJustifyText('');
      if (tab === 0) fetchDaily(); else fetchAbsences();
    } catch {} finally { setJustifyLoading(false); }
  };

  const clearFilters = () => {
    setFromDate(''); setToDate(''); setJustification(''); setSearch(''); setPage(0);
  };

  const studentCell = (r: CourseAttendance) => (
    <Box display="flex" alignItems="center" gap={1}>
      <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: r.isAbsent ? 'error.main' : 'success.main' }}>{r.student?.firstName?.[0]}</Avatar>
      <Box>
        <Typography variant="body2" fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
        {r.student?.registrationNumber && <Typography variant="caption" color="text.secondary">{r.student.registrationNumber}</Typography>}
      </Box>
    </Box>
  );

  const statusCell = (r: CourseAttendance) => (
    <Chip
      size="small"
      icon={r.isAbsent ? <Cancel /> : <CheckCircle />}
      label={r.isAbsent ? t('attendance.absent') : t('attendance.present')}
      color={r.isAbsent ? 'error' : 'success'}
      variant="outlined"
    />
  );

  const toggleCell = (r: CourseAttendance) => (
    <Button size="small" variant="outlined" color={r.isAbsent ? 'success' : 'error'} onClick={() => toggleStatus(r)}>
      {r.isAbsent ? t('students.markPresent') : t('students.markAbsent')}
    </Button>
  );

  const justificationCell = (r: CourseAttendance) =>
    r.isAbsent ? (
      <Chip size="small" color={r.justified ? 'success' : 'warning'} label={r.justified ? t('attendance.justified') : t('attendance.unjustified')} />
    ) : (
      <Typography color="text.secondary">—</Typography>
    );

  const actionsCell = (r: CourseAttendance) =>
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

  const dailyColumns: Column<CourseAttendance>[] = [
    { id: 'student', label: t('students.student'), sortable: false, accessor: studentCell },
    { id: 'status', label: t('common.status'), sortable: false, accessor: statusCell },
    { id: 'justified', label: t('attendance.justification'), sortable: false, accessor: justificationCell },
    { id: 'toggle', label: '', sortable: false, accessor: toggleCell },
    { id: 'actions', label: '', sortable: false, accessor: actionsCell },
  ];

  const absenceColumns: Column<CourseAttendance>[] = [
    { id: 'student', label: t('students.student'), sortable: false, accessor: studentCell },
    { id: 'date', label: t('common.date'), sortable: false, accessor: (r) => new Date(r.date).toLocaleDateString() },
    { id: 'justified', label: t('attendance.justification'), sortable: false, accessor: justificationCell },
    { id: 'justification', label: t('common.reason'), sortable: false, accessor: (r) => r.justification || '-' },
    { id: 'actions', label: '', sortable: false, accessor: actionsCell },
  ];

  return (
    <Box>
      <PageHeader title={t('students.courseAttendanceTitle')} subtitle={t('students.courseAttendanceSubtitle')} />

      <FilterRow sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label={t('courses.course')}
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setPage(0); }}
          sx={{ minWidth: 260, ...pillFieldSx }}
          slotProps={{ select: { displayEmpty: true } }}
        >
          {courses.length === 0 && <MenuItem value="">{t('students.noCourses')}</MenuItem>}
          {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        {courseId && (
          <Chip icon={<BookIcon />} label={courses.find((c) => c.id === courseId)?.name || ''} color="primary" variant="outlined" />
        )}
      </FilterRow>

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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                {justifyTarget ? new Date(justifyTarget.date).toLocaleDateString() : ''}
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
