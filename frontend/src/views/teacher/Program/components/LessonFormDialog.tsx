import { Box, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

import { useTranslation } from 'react-i18next';
interface LessonFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  title: string;
  onSetTitle: (v: string) => void;
  saveError: string;
  saving: boolean;
  onSave: () => void;
}

export default function LessonFormDialog({ open, onClose, editing, title, onSetTitle, saveError, saving, onSave }: LessonFormDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? t('program.editLesson') : t('program.addLessonNew')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField label={t('program.lessonTitle')} value={title} onChange={(e) => onSetTitle(e.target.value)} fullWidth />
          {saveError && <Alert severity="error" sx={{ borderRadius: 2 }}>{saveError}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={onSave} disabled={saving || !title.trim()}>{saving ? t('common.saving') : t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
