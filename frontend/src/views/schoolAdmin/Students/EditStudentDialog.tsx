import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem, Alert, Autocomplete } from '@mui/material';
import { useParams } from 'react-router-dom';
import type { Student, Classroom, UpdateStudentPayload } from '../../../types';
import { useTranslation } from 'react-i18next';
import classroomService from '../../../services/classroomService';

interface EditStudentDialogProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (data: UpdateStudentPayload) => Promise<void>;
}

export default function EditStudentDialog({ open, student, onClose, onSave }: EditStudentDialogProps) {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [form, setForm] = useState<{ firstName: string; lastName: string; dateOfBirth: string; gender: 'male' | 'female'; classroomId: string }>({ firstName: '', lastName: '', dateOfBirth: '', gender: 'male', classroomId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classroomWarning, setClassroomWarning] = useState('');

  useEffect(() => {
    if (schoolId) classroomService.getAll(schoolId).then((res) => setClassrooms(res.data || [])).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    if (open && student) {
      setForm({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender || 'male',
        classroomId: student.classroomId || '',
      });
    }
  }, [open, student]);

  const handleChange = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleClassroomChange = (value: any) => {
    handleChange('classroomId', value?.id || '');
    if (value) {
      const count = value.students?.length || 0;
      const isCurrent = value.id === student?.classroomId;
      const available = count + (isCurrent ? 0 : 1);
      setClassroomWarning(available > value.capacity ? t('students.classroomFull', { capacity: value.capacity, count }) : '');
    } else {
      setClassroomWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (classroomWarning) {
      setError(classroomWarning);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(form);
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
      <DialogTitle>{t('students.editStudent')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('common.gender')} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}><MenuItem value="male">{t('common.male')}</MenuItem><MenuItem value="female">{t('common.female')}</MenuItem></TextField></Grid>
          <Grid size={{ xs: 12 }}>
            <Autocomplete options={classrooms} getOptionLabel={(o) => `${o.name} (${o.students?.length || 0}/${o.capacity})`} value={classrooms.find((c) => c.id === form.classroomId) || null} onChange={(_, v) => handleClassroomChange(v)}
              renderInput={(params) => <TextField {...params} label={t('students.classroom')} />} />
          </Grid>
          {classroomWarning && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning">{classroomWarning}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
