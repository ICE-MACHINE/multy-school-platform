import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Alert,
  Typography, Box, Divider, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import courseService from '../../../../services/courseService';
import type { UnenrollPreview } from '../../../../types';

interface Props {
  open: boolean;
  courseId: string;
  courseName: string;
  studentId: string;
  onClose: () => void;
  onDone: (refunded: boolean) => void;
}

export default function UnenrollCourseDialog({ open, courseId, courseName, studentId, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [preview, setPreview] = useState<UnenrollPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refund, setRefund] = useState(true);

  useEffect(() => {
    if (!open || !schoolId) return;
    setPreview(null);
    setError('');
    setSaving(false);
    setRefund(true);
    setLoading(true);
    courseService
      .getUnenrollPreview(schoolId, courseId, studentId)
      .then((res) => setPreview(res.data))
      .catch((err: any) => setError(err?.response?.data?.message || t('courses.failedRefundCalc')))
      .finally(() => setLoading(false));
  }, [open, courseId, studentId, schoolId]);

  const handleConfirm = async () => {
    if (!schoolId) return;
    setSaving(true);
    setError('');
    try {
      await courseService.unenrollStudent(schoolId, courseId, studentId, preview?.mode === 'none' ? false : refund);
      onDone(refund);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('courses.failedUnenroll'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle>{t('courses.unenrollTitle', { course: courseName })}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : error && !preview ? (
          <Alert severity="error">{error}</Alert>
        ) : preview?.mode === 'none' ? (
          <Alert severity="info">{t('courses.unenrollNoRefund')}</Alert>
        ) : preview ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {preview.mode === 'required' && (
              <Alert severity="error">
                {t('courses.refundRequired')}
              </Alert>
            )}
            {preview.mode === 'adminDecision' && (
              <Alert severity="info">
                {t('courses.refundDecision')}
              </Alert>
            )}

            {preview.items.length > 0 && (
              <Box>
                <Typography variant="subtitle2" mb={0.5}>{t('courses.includedPayments')}</Typography>
                {preview.items.map((it, i) => (
                  <Box key={i} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">{it.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{t('courses.amountDzd', { amount: it.amount })}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={700}>{t('courses.totalRefund')}</Typography>
                  <Typography fontWeight={700} color="error.main">{t('courses.amountDzd', { amount: preview.refundAmount })}</Typography>
                </Box>
              </Box>
            )}

            {preview.mode === 'adminDecision' && (
              <RadioGroup row value={refund} onChange={(e) => setRefund(e.target.value === 'true')}>
                <FormControlLabel value="true" control={<Radio />} label={t('courses.refundAmount', { amount: preview.refundAmount })} />
                <FormControlLabel value="false" control={<Radio />} label={t('courses.noRefund')} />
              </RadioGroup>
            )}

            {preview.mode === 'required' && (
              <Typography variant="body2" color="text.secondary">
                {t('courses.refundNote', { amount: preview.refundAmount })}
              </Typography>
            )}
          </Box>
        ) : null}

        {error && preview && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={saving || loading}>
          {saving
            ? t('courses.removing')
            : preview?.mode === 'adminDecision'
              ? refund
                ? t('courses.removeWithRefund', { amount: preview.refundAmount })
                : t('courses.removeWithoutRefund')
              : preview?.mode === 'required'
                ? t('courses.removeAndRefund', { amount: preview.refundAmount })
                : t('courses.confirmRemove')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
