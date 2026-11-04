import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem, Alert, Typography, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import type { Parent } from '../../../types';

interface EditParentDialogProps {
  open: boolean;
  parent: Parent | null;
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; phone: string; gender: string; placeOfResidence: string; password?: string }) => Promise<void>;
}

export default function EditParentDialog({ open, parent, onClose, onSave }: EditParentDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', gender: 'male', placeOfResidence: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && parent) {
      setForm({
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        gender: (parent as any).gender || 'male',
        placeOfResidence: (parent as any).placeOfResidence || '',
        password: '',
      });
    }
  }, [open, parent]);

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent) return;
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      await onSave(payload);
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
      <DialogTitle>{t('parents.editParent')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('common.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('common.gender')} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}><MenuItem value="male">{t('common.male')}</MenuItem><MenuItem value="female">{t('common.female')}</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('parents.placeOfResidence')} value={form.placeOfResidence} onChange={(e) => handleChange('placeOfResidence', e.target.value)} /></Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">{t('teachers.leavePasswordBlank')}</Typography>
            <TextField fullWidth label={t('auth.newPassword')} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)}
              slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
