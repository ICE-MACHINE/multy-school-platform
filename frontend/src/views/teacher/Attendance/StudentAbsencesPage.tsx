import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Chip, Avatar, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Snackbar, Alert } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';
import teacherService from '../../../services/teacherService';
import attendanceService from '../../../services/attendanceService';
import type { Student, Attendance } from '../../../types';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const periodLabel = (t: TFunction, p: string) => (p === 'morning' || p === 'afternoon' ? t(`activities.${p}`) : p);

export default function StudentAbsencesPage() {
  const { t } = useTranslation();
  const { schoolId, studentId } = useParams<{ schoolId: string; studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [absences, setAbsences] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Attendance | null>(null);
  const [justifyText, setJustifyText] = useState('');
  const [justifyLoading, setJustifyLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    try {
      const s = await teacherService.getStudent(schoolId, studentId);
      setStudent(s.data);
      const att = await attendanceService.getByStudent(schoolId, studentId);
      const records: Attendance[] = att.data?.records || [];
      setAbsences(records.filter((r) => r.isAbsent));
    } catch {
      setMsg({ type: 'error', text: t('teacher.absenceLoadFailed') });
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, t]);

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
      setMsg({ type: 'success', text: t('teacher.justifiedSuccess') });
      fetch();
    } catch {
      setMsg({ type: 'error', text: t('teacher.justifyFailed') });
    } finally {
      setJustifyLoading(false);
    }
  };

  const justifiedCount = absences.filter((r) => r.justified).length;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>{t('common.back')}</Button>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t('teacher.absenceRecordOf', { name: student ? `${student.firstName} ${student.lastName}` : '' })}
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h3" fontWeight={800} color="error.main">{absences.length}</Typography>
            <Typography color="text.secondary">{t('attendance.totalAbsences')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h3" fontWeight={800} color="success.main">{justifiedCount}</Typography>
            <Typography color="text.secondary">{t('attendance.justified')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h3" fontWeight={800} color="warning.main">{absences.length - justifiedCount}</Typography>
            <Typography color="text.secondary">{t('attendance.unjustified')}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : absences.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">{t('teacher.noAbsencesForStudent')}</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.date')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('activities.period')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.reason')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.justify')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {absences.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => openJustify(r)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>{periodLabel(t, r.period)}</TableCell>
                  <TableCell>
                    <Chip label={r.justified ? t('attendance.justified') : t('attendance.unjustified')} size="small" color={r.justified ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell>{r.justification || '—'}</TableCell>
                  <TableCell>
                    <Button size="small" variant={r.justified ? 'text' : 'outlined'} startIcon={<GavelIcon />} onClick={(e) => { e.stopPropagation(); openJustify(r); }}>
                      {r.justified ? t('common.edit') : t('attendance.justify')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!target} onClose={() => setTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('attendance.justifyAbsence')}</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>{student?.firstName?.[0]}</Avatar>
            <Box>
              <Typography fontWeight={600}>{student?.firstName} {student?.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {target ? `${new Date(target.date).toLocaleDateString()} — ${periodLabel(t, target.period)}` : ''}
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

      <Snackbar open={!!msg} autoHideDuration={2500} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type || 'success'}>{msg?.text}</Alert>
      </Snackbar>
    </Box>
  );
}
