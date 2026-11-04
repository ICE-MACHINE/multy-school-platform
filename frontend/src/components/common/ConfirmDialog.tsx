import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, confirmText, cancelText, severity = 'error', onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmLabel = confirmText ?? t('common.confirm');
  const cancelLabel = cancelText ?? t('common.cancel');
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            transition: 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important',
          },
        },
        paper: {
          sx: {
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important',
          },
        },
      }}
      transitionDuration={200}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
        <Button variant="contained" color={severity} onClick={onConfirm} disabled={loading}>
          {loading ? t('common.processing') : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
