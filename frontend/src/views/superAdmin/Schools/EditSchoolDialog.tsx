import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { School } from '../../../types';

interface EditSchoolDialogProps {
  open: boolean;
  school: School | null;
  onClose: () => void;
  onSave: (data: { name: string; phone: string; address: string; maxUsers: number; maxMessages: number }) => Promise<void>;
}

export default function EditSchoolDialog({ open, school, onClose, onSave }: EditSchoolDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', address: '', maxUsers: 100, maxMessages: 5000 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && school) {
      setForm({
        name: school.name,
        phone: school.phone,
        address: school.address || '',
        maxUsers: school.maxUsers || 100,
        maxMessages: school.maxMessages || 5000,
      });
    }
  }, [open, school]);

  const handleChange = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await onSave(form);
      setSuccess(t('schools.updated'));
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('common.failedToUpdate'));
    } finally { setLoading(false); }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle>{t('schools.editSchool')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}><TextField fullWidth label={t('schools.schoolName')} value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('common.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.address')} value={form.address} onChange={(e) => handleChange('address', e.target.value)} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.maxUsers')} type="number" value={form.maxUsers} onChange={(e) => handleChange('maxUsers', Number(e.target.value))} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.maxMessages')} type="number" value={form.maxMessages} onChange={(e) => handleChange('maxMessages', Number(e.target.value))} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
