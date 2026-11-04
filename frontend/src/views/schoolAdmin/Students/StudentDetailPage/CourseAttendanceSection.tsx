import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Chip, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppBadIcon from '@mui/icons-material/GppBad';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import CourseIcon from '@mui/icons-material/MenuBook';
import StatsCard from '../../../../components/common/StatsCard';
import { useTranslation } from 'react-i18next';
import courseAttendanceService from '../../../../services/courseAttendanceService';
import { formatMonthKey } from '../../../../utils/arabicMonths';
import type { Student, CourseStudentAttendanceGroup, CourseAttendance } from '../../../../types';

const MONTH_OPTIONS: string[] = (() => {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
})();

export default function CourseAttendanceSection({ student }: { student: Student }) {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [groups, setGroups] = useState<CourseStudentAttendanceGroup[]>([]);
  const [summary, setSummary] = useState<{ absentDays: number; justifiedAbsences: number; unjustifiedAbsences: number; totalRecords: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [target, setTarget] = useState<CourseAttendance | null>(null);
  const [justifyText, setJustifyText] = useState('');
  const [justifyLoading, setJustifyLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await courseAttendanceService.getByStudent(schoolId, student.id, month || undefined);
      setGroups(res.data?.courses || []);
      setSummary(res.data?.summary || null);
    } catch {} finally { setLoading(false); }
  }, [schoolId, student.id, month]);

  useEffect(() => { fetch(); }, [fetch]);

  const openJustify = (record: CourseAttendance) => {
    setTarget(record);
    setJustifyText(record.justification || '');
  };

  const handleJustify = async () => {
    if (!schoolId || !target || !justifyText.trim()) return;
    setJustifyLoading(true);
    try {
      await courseAttendanceService.justify(schoolId, target.courseId, target.id, justifyText.trim());
      setTarget(null);
      setJustifyText('');
      fetch();
    } catch {} finally { setJustifyLoading(false); }
  };

  const totalAbsences = summary?.absentDays ?? 0;

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('students.totalRecords')} value={summary?.totalRecords ?? 0} icon={<CheckCircleIcon />} color="#6366f1" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('students.absences')} value={totalAbsences} icon={<EventBusyIcon />} color="#ef4444" loading={loading} />
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
          {t('students.courseAttendanceHint')}
        </Typography>
      </Box>

      {loading ? (
        <Typography color="text.secondary" py={4}>{t('common.loading')}</Typography>
      ) : groups.length === 0 ? (
        <Typography color="text.secondary" py={4} textAlign="center">{t('students.noAttendanceForStudent')}</Typography>
      ) : (
        groups.map((g) => (
          <Paper key={g.courseId} variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <CourseIcon color="primary" />
                <Typography variant="h6">{g.courseName}</Typography>
              </Box>
              <Box display="flex" gap={0.75} flexWrap="wrap">
                <Chip size="small" label={t('students.recordsChip', { count: g.summary.totalDays })} variant="outlined" />
                <Chip size="small" label={t('students.absentChip', { count: g.summary.absentDays })} color="error" />
                <Chip size="small" label={t('students.justifiedChip', { count: g.summary.justifiedAbsences })} color="success" />
              </Box>
            </Box>
            {g.records.length === 0 ? (
              <Typography color="text.secondary" py={2}>{t('students.noRecords')}</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('common.date')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                      <TableCell>{t('attendance.justification')}</TableCell>
                      <TableCell>{t('common.reason')}</TableCell>
                      <TableCell>{t('students.action')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {g.records.map((r) => (
                      <TableRow key={r.id} hover sx={{ cursor: r.isAbsent ? 'pointer' : 'default' }} onClick={() => { if (r.isAbsent) openJustify(r); }}>
                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} color={r.isAbsent ? 'error' : 'success'} />
                        </TableCell>
                        <TableCell>
                          {r.isAbsent
                            ? <Chip size="small" color={r.justified ? 'success' : 'warning'} label={r.justified ? t('attendance.justified') : t('attendance.unjustified')} />
                            : '-'}
                        </TableCell>
                        <TableCell>{r.justification || '-'}</TableCell>
                        <TableCell>
                          {r.isAbsent ? (
                            <Button size="small" variant={r.justified ? 'text' : 'outlined'} startIcon={<GavelIcon />}
                              onClick={(e) => { e.stopPropagation(); openJustify(r); }}>
                              {r.justified ? t('common.edit') : t('attendance.justify')}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        ))
      )}

      <Dialog open={!!target} onClose={() => setTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('attendance.justifyAbsence')}</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box>
              <Typography fontWeight={600}>{student.firstName} {student.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {target ? new Date(target.date).toLocaleDateString() : ''}
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
