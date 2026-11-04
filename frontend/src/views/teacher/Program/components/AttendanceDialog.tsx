import { Box, Typography, TextField, Alert, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import GlassSurface from '../../../../components/common/GlassSurface';
import type { CourseSession, CourseSessionAttendanceView } from '../../../../types';
import { useTranslation } from 'react-i18next';


interface AttendanceDialogProps {
  session: CourseSession | null;
  onClose: () => void;
  attendanceView: CourseSessionAttendanceView | null;
  attendanceDraft: Record<string, boolean>;
  onToggleAbsent: (studentId: string, isAbsent: boolean) => void;
  loading: boolean;
  saving: boolean;
  saveError: string;
  onSave: () => void;
}

export default function AttendanceDialog({
  session, onClose, attendanceView, attendanceDraft, onToggleAbsent, loading, saving, saveError, onSave,
}: AttendanceDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={!!session} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('program.recordAttendanceTitle', { number: session?.sessionNumber })}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : attendanceView ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">{t('program.dateLabel', { date: attendanceView.date ? new Date(attendanceView.date).toLocaleDateString() : '-' })}</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.75} mt={1}>
                {attendanceView.lessons.length > 0 ? attendanceView.lessons.map((l) => <Chip key={l.id} label={l.title} size="small" variant="outlined" color="primary" />) : <Typography variant="caption" color="text.secondary">{t('program.noLessons')}</Typography>}
              </Box>
            </Box>
            {attendanceView.attendance.length === 0 ? (
              <Box py={2} textAlign="center"><Typography color="text.secondary">{t('program.noStudentsInCourse')}</Typography></Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {attendanceView.attendance.map((r) => (
                  <GlassSurface key={r.id} strength="subtle" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1.5, py: 1, borderRadius: 3 }}>
                    <Box>
                      <Typography fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.student?.registrationNumber}</Typography>
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', p: 0.4, bgcolor: 'action.hover', borderRadius: 999, border: '1px solid', borderColor: 'divider' }}>
                      <Box onClick={() => onToggleAbsent(r.studentId, false)}
                        sx={{ px: 2, py: 0.75, borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', bgcolor: !attendanceDraft[r.studentId] ? 'success.main' : 'transparent', color: !attendanceDraft[r.studentId] ? 'common.white' : 'text.secondary', transition: 'all 200ms', '&:hover': { bgcolor: !attendanceDraft[r.studentId] ? 'success.main' : 'action.selected' } }}>
                        {t('attendance.present')}
                      </Box>
                      <Box onClick={() => onToggleAbsent(r.studentId, true)}
                        sx={{ px: 2, py: 0.75, borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', bgcolor: attendanceDraft[r.studentId] ? 'error.main' : 'transparent', color: attendanceDraft[r.studentId] ? 'common.white' : 'text.secondary', transition: 'all 200ms', '&:hover': { bgcolor: attendanceDraft[r.studentId] ? 'error.main' : 'action.selected' } }}>
                        {t('attendance.absent')}
                      </Box>
                    </Box>
                  </GlassSurface>
                ))}
              </Box>
            )}
            {saveError && <Alert severity="error" sx={{ borderRadius: 2 }}>{saveError}</Alert>}
          </Box>
        ) : (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{t('program.failedLoadSessionAttendance')}</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.close')}</Button>
        <Button variant="contained" onClick={onSave} disabled={saving || loading || !attendanceView}>{saving ? t('common.saving') : t('program.saveAttendance')}</Button>
      </DialogActions>
    </Dialog>
  );
}
