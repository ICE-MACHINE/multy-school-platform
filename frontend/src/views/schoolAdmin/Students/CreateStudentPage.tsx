import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, MenuItem, Grid, Alert, Autocomplete } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import studentService from '../../../services/studentService';
import parentService from '../../../services/parentService';
import classroomService from '../../../services/classroomService';
import type { Parent, Classroom } from '../../../types';

export default function CreateStudentPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [form, setForm] = useState<{ firstName: string; lastName: string; dateOfBirth: string; gender: 'male' | 'female'; healthStatus: string; parentId: string; classroomId: string; registrationNumber: string }>({ firstName: '', lastName: '', dateOfBirth: '', gender: 'male', healthStatus: '', parentId: '', classroomId: '', registrationNumber: '' });
  const [error, setError] = useState('');
  const [classroomWarning, setClassroomWarning] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolId) {
      parentService.getAll(schoolId, { limit: 100 }).then((res) => setParents(res.data || []));
      classroomService.getAll(schoolId).then((res) => setClassrooms(res.data || [])).catch(() => {});
    }
  }, [schoolId]);

  const handleChange = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleClassroomChange = (value: any) => {
    handleChange('classroomId', value?.id || '');
    if (value) {
      const count = value.students?.length || 0;
      setClassroomWarning(count >= value.capacity ? t('students.classroomFull', { capacity: value.capacity, count }) : '');
    } else {
      setClassroomWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    if (!form.parentId) {
      setError(t('students.parentRequired'));
      return;
    }
    if (classroomWarning) {
      setError(classroomWarning);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await studentService.create(schoolId, form);
      navigate(`/s/${schoolId}/admin/students`);
    } catch (err: any) { setError(err?.response?.data?.message || t('students.failedToCreate')); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <PageHeader title={t('students.addStudent')} subtitle={t('students.registerNew')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.registrationNumber')} value={form.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete options={parents} getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.phone})`} onChange={(_, v) => handleChange('parentId', v?.id || '')}
                  renderInput={(params) => <TextField {...params} label={t('students.parent')} required />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete options={classrooms} getOptionLabel={(o) => `${o.name} (${o.students?.length || 0}/${o.capacity})`} onChange={(_, v) => handleClassroomChange(v)}
                  renderInput={(params) => <TextField {...params} label={t('students.classroom')} helperText={t('students.classroomHelper')} />} />
              </Grid>
              {classroomWarning && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="warning">{classroomWarning}</Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('common.gender')} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}><MenuItem value="male">{t('common.male')}</MenuItem><MenuItem value="female">{t('common.female')}</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label={t('students.healthStatus')} value={form.healthStatus} onChange={(e) => handleChange('healthStatus', e.target.value)} multiline rows={2} /></Grid>
            </Grid>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.creating') : t('students.createStudent')}</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
