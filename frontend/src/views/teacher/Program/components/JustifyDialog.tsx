import { Box, Typography, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

import { useTranslation } from 'react-i18next';
interface JustifyDialogProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  text: string;
  onSetText: (v: string) => void;
  saving: boolean;
  error: string;
  onConfirm: () => void;
}

export default function JustifyDialog({ open, onClose, studentName, text, onSetText, saving, error, onConfirm }: JustifyDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('program.justifyAbsenceTitle')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography variant="body2" fontWeight={600}>{t('program.studentLabel', { name: studentName })}</Typography>
          <TextField label={t('program.absenceReason')} multiline rows={3} value={text} onChange={(e) => onSetText(e.target.value)} />
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={onConfirm} disabled={saving || !text.trim()}>{saving ? t('common.saving') : t('program.confirmJustify')}</Button>
      </DialogActions>
    </Dialog>
  );
}
