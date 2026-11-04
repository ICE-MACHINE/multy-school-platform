import { Box, Typography, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel } from '@mui/material';
import GlassSurface from '../../../../components/common/GlassSurface';
import type { LessonLike } from '../types';
import { useTranslation } from 'react-i18next';


interface CompleteSessionDialogProps {
  open: boolean;
  onClose: () => void;
  sessionNumber: string;
  onSetSessionNumber: (v: string) => void;
  completedAt: string;
  onSetCompletedAt: (v: string) => void;
  lessons: LessonLike[];
  selectedLessonIds: string[];
  onToggleLesson: (id: string) => void;
  defaultNextSession: number | null;
  totalSessions: number;
  maxCompleted: number;
  saveError: string;
  saving: boolean;
  onSave: () => void;
}

export default function CompleteSessionDialog({
  open, onClose, sessionNumber, onSetSessionNumber, completedAt, onSetCompletedAt,
  lessons, selectedLessonIds, onToggleLesson, defaultNextSession, totalSessions, maxCompleted,
  saveError, saving, onSave,
}: CompleteSessionDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('program.completeSession')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          {defaultNextSession != null && <Alert severity="info" sx={{ borderRadius: 2 }}>{t('program.expectedNextSession', { number: defaultNextSession })}</Alert>}
          <TextField label={t('program.sessionNumber')} type="number" value={sessionNumber} onChange={(e) => onSetSessionNumber(e.target.value)}
            inputProps={{ min: 1, max: totalSessions || undefined }} />
          <TextField label={t('program.completionDate')} type="date" value={completedAt} onChange={(e) => onSetCompletedAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} />
          <Box>
            <Typography variant="subtitle2" mb={1} fontWeight={600}>{t('program.lessonsGiven')}</Typography>
            <GlassSurface strength="subtle" sx={{ maxHeight: 240, overflow: 'auto', p: 1.5, borderRadius: 2 }}>
              {lessons.length === 0 ? (
                <Typography color="text.secondary" py={2} textAlign="center">{t('program.noLessonsAddFirst')}</Typography>
              ) : lessons.map((l) => (
                <FormControlLabel key={l.id} control={
                  <Checkbox checked={selectedLessonIds.includes(l.id)} onChange={(e) => onToggleLesson(l.id)} />
                } label={<Typography variant="body2">{l.title}</Typography>} />
              ))}
            </GlassSurface>
          </Box>
          {saveError && <Alert severity="error" sx={{ borderRadius: 2 }}>{saveError}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={onSave} disabled={saving || lessons.length === 0}>{saving ? t('common.saving') : t('program.confirmCompletion')}</Button>
      </DialogActions>
    </Dialog>
  );
}
