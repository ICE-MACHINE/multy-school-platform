import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Divider, Alert, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';

export interface DeletePreviewGroup {
  title: string;
  items: { label: string; amount: number }[];
  subtotal: number;
}

interface DeletePreviewDialogProps {
  open: boolean;
  title: string;
  message: string;
  groups: DeletePreviewGroup[];
  totalRefund: number;
  noRefundsMessage?: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeletePreviewDialog({
  open, title, message, groups, totalRefund, noRefundsMessage,
  confirmText, cancelText, severity = 'error', onConfirm, onCancel, loading,
}: DeletePreviewDialogProps) {
  const { t } = useTranslation();
  const noRefundsLabel = noRefundsMessage ?? t('common.noRefundsForOperation');
  const confirmLabel = confirmText ?? t('common.confirm');
  const cancelLabel = cancelText ?? t('common.cancel');
  const hasRefunds = totalRefund > 0 || groups.some((g) => g.items.length > 0);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: { transition: 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important' },
        },
        paper: {
          sx: {
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important',
          },
        },
      }}
      transitionDuration={200}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color={severity} />
        {title}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" mb={2}>{message}</Typography>

        {hasRefunds ? (
          <>
            {groups.map((group, idx) => (
              <Box key={idx} mb={2}>
                <Typography fontWeight={700} variant="body2" mb={0.5}>{group.title}</Typography>
                <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <TableBody>
                    {group.items.map((item, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ borderBottom: '1px solid', borderBottomColor: 'divider' }}>{item.label || t('common.paymentWithoutMonth')}</TableCell>
                        <TableCell align="left" sx={{ fontWeight: 600, borderBottom: '1px solid', borderBottomColor: 'divider' }}>{item.amount.toLocaleString()} DA</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t('common.total')}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700 }}>{group.subtotal.toLocaleString()} DA</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>{t('common.totalRefundAmount')}</Typography>
              <Typography fontWeight={700} fontSize={18} color="error.main">{totalRefund.toLocaleString()} DA</Typography>
            </Box>
          </>
        ) : (
          <Alert severity="info">{noRefundsLabel}</Alert>
        )}
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
