import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Avatar, Snackbar, Alert, Chip, IconButton, Tooltip } from '@mui/material';
import WbSunny from '@mui/icons-material/WbSunny';
import Nightlight from '@mui/icons-material/Nightlight';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PageHeader from '../../../components/common/PageHeader';
import SegmentedControl from '../../../components/common/SegmentedControl';
import FilterRow from '../../../components/common/FilterBar';
import { pillFieldSx } from '../../../components/common/filterStyles';
import DataTable, { type Column } from '../../../components/common/DataTable';
import teacherService from '../../../services/teacherService';
import attendanceService from '../../../services/attendanceService';
import type { Student, Attendance, ActivityPeriod } from '../../../types';
import { useTranslation } from 'react-i18next';


interface StudentRow {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  isAbsent: boolean;
  totalAbsences: number;
  unjustifiedAbsences: number;
}

export default function TeacherAttendancePage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<ActivityPeriod>('morning');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, Attendance>>({});
  const [absenceCounts, setAbsenceCounts] = useState<Record<string, { total: number; unjustified: number }>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const month = date.slice(0, 7);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    const res = await teacherService.getStudents(schoolId);
    const list = res.data || [];
    setStudents(list);
    const att = await attendanceService.getByDate(schoolId, date, period);
    const map: Record<string, Attendance> = {};
    (att.data || []).forEach((r) => { if (r.student?.id) map[r.student.id] = r; });
    setRecords(map);
    try {
      const counts = await attendanceService.getAbsenceCounts(schoolId, month);
      const cm: Record<string, { total: number; unjustified: number }> = {};
      (counts.data || []).forEach((c) => { cm[c.studentId] = { total: c.totalAbsences, unjustified: c.unjustifiedAbsences }; });
      setAbsenceCounts(cm);
    } catch { /* counts are optional */ }
  }, [schoolId, date, period, month]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const toggleAbsent = async (studentId: string) => {
    if (!schoolId) return;
    const existing = records[studentId];
    const newAbsent = existing ? !existing.isAbsent : true;
    setSaving(true);
    try {
      let activitySync: { changed: boolean; affected: string[] } | undefined;
      if (existing) {
        const res = await attendanceService.update(schoolId, existing.id, { isAbsent: newAbsent });
        activitySync = res.data?.activitySync;
      } else {
        const res = await attendanceService.create(schoolId, { studentId, date, period, isAbsent: newAbsent });
        activitySync = res.data?.activitySync;
      }
      setRecords((p) => ({
        ...p,
        [studentId]: { ...(existing || { id: '' }), studentId, date, period, isAbsent: newAbsent } as Attendance,
      }));
      if (activitySync?.changed && activitySync.affected.length > 0) {
        setMsg({
          type: 'success',
          text: t('teacher.activitySyncUpdated', { activities: activitySync.affected.join(', ') }),
        });
      } else {
        setMsg({ type: 'success', text: t('teacher.attendanceUpdated') });
      }
      const counts = await attendanceService.getAbsenceCounts(schoolId, month);
      const cm: Record<string, { total: number; unjustified: number }> = {};
      (counts.data || []).forEach((c) => { cm[c.studentId] = { total: c.totalAbsences, unjustified: c.unjustifiedAbsences }; });
      setAbsenceCounts(cm);
    } catch { setMsg({ type: 'error', text: t('teacher.attendanceUpdateFailed') }); }
    finally { setSaving(false); }
  };

  const rows: StudentRow[] = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    firstName: s.firstName,
    lastName: s.lastName,
    registrationNumber: s.registrationNumber,
    isAbsent: records[s.id]?.isAbsent ?? false,
    totalAbsences: absenceCounts[s.id]?.total ?? 0,
    unjustifiedAbsences: absenceCounts[s.id]?.unjustified ?? 0,
  }));

  const absentCount = rows.filter((r) => r.isAbsent).length;

  const columns: Column<StudentRow>[] = [
    {
      id: 'name',
      label: t('students.student'),
      accessor: (r) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: r.isAbsent ? 'error.main' : 'success.main', width: 34, height: 34, fontSize: '0.9rem' }}>{r.firstName[0]}</Avatar>
          <Box>
            <Typography fontWeight={600} fontSize="0.9rem">{r.name}</Typography>
            <Typography variant="caption" color="text.secondary">{r.registrationNumber}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'unjustifiedAbsences',
      label: t('teacher.absencesUnjustified'),
      accessor: (r) => r.totalAbsences > 0 ? (
        <Chip
          size="small"
          color={r.unjustifiedAbsences > 0 ? 'error' : 'success'}
          variant="outlined"
          label={r.unjustifiedAbsences > 0 ? t('teacher.unjustifiedOfTotal', { count: r.unjustifiedAbsences, total: r.totalAbsences }) : t('teacher.allJustified')}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">—</Typography>
      ),
    },
    {
      id: 'isAbsent',
      label: t('common.status'),
      accessor: (r) => (
        <Chip size="small" color={r.isAbsent ? 'error' : 'success'} label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} />
      ),
    },
    {
      id: 'toggle',
      label: t('teacher.recordAttendance'),
      sortable: false,
      accessor: (r) => (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', p: 0.4, bgcolor: 'action.hover', borderRadius: 999, border: '1px solid', borderColor: 'divider' }}>
          <Box
            onClick={(e) => { e.stopPropagation(); if (r.isAbsent) toggleAbsent(r.id); }}
            sx={{
              px: 1.6,
              py: 0.4,
              borderRadius: 999,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              bgcolor: !r.isAbsent ? 'success.main' : 'transparent',
              color: !r.isAbsent ? '#fff' : 'text.secondary',
              fontWeight: 700,
              fontSize: '0.78rem',
              transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { bgcolor: !r.isAbsent ? 'success.main' : 'action.selected' },
            }}
          >
            {t('attendance.present')}
          </Box>
          <Box
            onClick={(e) => { e.stopPropagation(); if (!r.isAbsent) toggleAbsent(r.id); }}
            sx={{
              px: 1.6,
              py: 0.4,
              borderRadius: 999,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              bgcolor: r.isAbsent ? 'error.main' : 'transparent',
              color: r.isAbsent ? '#fff' : 'text.secondary',
              fontWeight: 700,
              fontSize: '0.78rem',
              transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { bgcolor: r.isAbsent ? 'error.main' : 'action.selected' },
            }}
          >
            {t('attendance.absent')}
          </Box>
        </Box>
      ),
    },
    {
      id: 'actions',
      label: t('titles.attendanceRecord'),
      sortable: false,
      accessor: (r) => (
        <Tooltip title={t('titles.attendanceRecord')}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); navigate(`/s/${schoolId}/teacher/attendance/${r.id}`); }}
            sx={{ color: 'primary.main' }}
          >
            <ReceiptLongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title={t('titles.attendance')} subtitle={t('teacher.attendanceSubtitle')} />

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
            { value: 'morning', label: t('activities.morning'), icon: <WbSunny fontSize="small" /> },
            { value: 'afternoon', label: t('activities.afternoon'), icon: <Nightlight fontSize="small" /> },
          ]}
        />
        <Chip
          label={t('teacher.absentOfTotal', { absent: absentCount, total: rows.length })}
          color={absentCount > 0 ? 'warning' : 'success'}
          variant="outlined"
          sx={{ ml: 'auto', fontWeight: 600 }}
        />
      </FilterRow>

      <DataTable<StudentRow>
        columns={columns}
        data={rows}
        keyExtractor={(r) => r.id}
        searchable
        searchKeys={['name', 'registrationNumber']}
        onRowClick={(r) => navigate(`/s/${schoolId}/teacher/attendance/${r.id}`)}
        rowSx={(r) => ({ bgcolor: r.isAbsent ? 'rgba(239, 68, 68, 0.06)' : undefined })}
        emptyMessage={t('teacher.noStudentsInClass')}
      />

      <Snackbar open={!!msg} autoHideDuration={2000} onClose={() => setMsg(null)}><Alert severity={msg?.type}>{msg?.text}</Alert></Snackbar>
    </Box>
  );
}
