import { Box, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

import { useTranslation } from 'react-i18next';
interface ProgramFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  title: string;
  onSetTitle: (v: string) => void;
  description: string;
  onSetDescription: (v: string) => void;
  saveError: string;
  saving: boolean;
  onSave: () => void;
}

export default function ProgramFormDialog({ open, onClose, editing, title, onSetTitle, description, onSetDescription, saveError, saving, onSave }: ProgramFormDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? t('program.editProgram') : t('program.createProgram')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField label={t('program.programTitle')} value={title} onChange={(e) => onSetTitle(e.target.value)} fullWidth />
          <TextField label={t('program.programDescription')} value={description} onChange={(e) => onSetDescription(e.target.value)} multiline rows={3} fullWidth />
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
