import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem, Alert, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { IconButton, InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TeacherPlacementSelect from './components/TeacherPlacementSelect';
import { useSchool } from '../../../hooks/useSchool';
import type { Teacher } from '../../../types';

interface EditTeacherDialogProps {
  open: boolean;
  teacher: Teacher | null;
  schoolId?: string;
  onClose: () => void;
  onSave: (data: { firstName: string; lastName: string; phone: string; gender: string; dateOfBirth: string; password?: string; classroomId?: string | null; courseId?: string | null }) => Promise<void>;
}

export default function EditTeacherDialog({ open, teacher, schoolId, onClose, onSave }: EditTeacherDialogProps) {
  const { t } = useTranslation();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', gender: 'male', dateOfBirth: '', password: '', assignmentId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && teacher) {
      setForm({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        gender: (teacher as any).gender || 'male',
        dateOfBirth: (teacher as any).dateOfBirth || '',
        password: '',
        assignmentId: isPrivate ? teacher.courseId || '' : teacher.classroomId || '',
      });
    }
  }, [open, teacher, isPrivate]);

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form };
      delete payload.assignmentId;
      if (!payload.password) delete payload.password;
      if (isPrivate) {
        payload.courseId = form.assignmentId || null;
      } else {
        payload.classroomId = form.assignmentId || null;
      }
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
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogTitle>{t('teachers.editTeacher')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('common.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('common.gender')} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}><MenuItem value="male">{t('common.male')}</MenuItem><MenuItem value="female">{t('common.female')}</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">{isPrivate ? t('teachers.course') : t('teachers.classroom')}</Typography>
            {schoolId && (
              <TeacherPlacementSelect fullWidth schoolId={schoolId} value={form.assignmentId} onChange={(id) => handleChange('assignmentId', id)} />
            )}
          </Grid>
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
