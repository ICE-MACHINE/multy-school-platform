import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, MenuItem, Grid, Alert, Typography, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PageHeader from '../../../components/common/PageHeader';
import TeacherPlacementSelect from './components/TeacherPlacementSelect';
import { useSchool } from '../../../hooks/useSchool';
import { useTranslation } from 'react-i18next';
import teacherManagementService from '../../../services/teacherManagementService';

export default function CreateTeacherPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: 'male', phone: '', password: '', assignmentId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setError('');
    setLoading(true);
    try {
      const payload: any = { ...form };
      delete payload.assignmentId;
      if (isPrivate) {
        payload.courseId = form.assignmentId || undefined;
      } else {
        payload.classroomId = form.assignmentId || undefined;
      }
      await teacherManagementService.create(schoolId, payload);
      navigate(`/s/${schoolId}/admin/teachers`);
    } catch (err: any) { setError(err?.response?.data?.message || t('teachers.failedToCreate')); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <PageHeader title={t('teachers.addTeacher')} subtitle={t('teachers.registerNew')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.dateOfBirth')} type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('common.gender')} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}><MenuItem value="male">{t('common.male')}</MenuItem><MenuItem value="female">{t('common.female')}</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('common.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t('auth.password')} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} required
                  slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" mb={0.5} display="block">{isPrivate ? t('teachers.course') : t('teachers.classroom')}</Typography>
                {schoolId && (
                  <TeacherPlacementSelect fullWidth schoolId={schoolId} value={form.assignmentId} onChange={(id) => handleChange('assignmentId', id)} />
                )}
              </Grid>
            </Grid>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.creating') : t('teachers.createTeacher')}</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
