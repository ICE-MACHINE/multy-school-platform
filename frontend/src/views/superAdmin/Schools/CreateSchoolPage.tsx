import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, MenuItem, Grid, Alert } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import schoolService from '../../../services/schoolService';

export default function CreateSchoolPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', slug: '', type: 'quranic' as 'quranic' | 'private' | 'kindergarten',
    phone: '', address: '', maxUsers: 100, maxMessages: 5000,
    adminFirstName: '', adminLastName: '', adminPhone: '', adminPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await schoolService.create(form);
      navigate('/superAdmin/schools');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('schools.failedToCreate'));
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <PageHeader title={t('titles.createSchool')} subtitle={t('schools.createSubtitle')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" mb={2}>{t('schools.schoolInfo')}</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.schoolName')} value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.schoolSlug')} value={form.slug} onChange={(e) => handleChange('slug', e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} required helperText={t('schools.schoolSlugHelper')} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth select label={t('schools.schoolType')} value={form.type} onChange={(e) => handleChange('type', e.target.value)} required>
                  <MenuItem value="quranic">{t('schoolTypes.quranic')}</MenuItem>
                  <MenuItem value="private">{t('schoolTypes.private')}</MenuItem>
                  <MenuItem value="kindergarten">{t('schoolTypes.kindergarten')}</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('common.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label={t('schools.address')} value={form.address} onChange={(e) => handleChange('address', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.maxUsers')} type="number" value={form.maxUsers} onChange={(e) => handleChange('maxUsers', Number(e.target.value))} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.maxMessages')} type="number" value={form.maxMessages} onChange={(e) => handleChange('maxMessages', Number(e.target.value))} /></Grid>
            </Grid>

            <Typography variant="h6" mb={2}>{t('schools.adminAccount')}</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.adminFirstName} onChange={(e) => handleChange('adminFirstName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.adminLastName} onChange={(e) => handleChange('adminLastName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.adminPhone')} value={form.adminPhone} onChange={(e) => handleChange('adminPhone', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('auth.password')} type="password" value={form.adminPassword} onChange={(e) => handleChange('adminPassword', e.target.value)} required /></Grid>
            </Grid>

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => navigate('/superAdmin/schools')}>{t('common.cancel')}</Button>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.creating') : t('titles.createSchool')}</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
