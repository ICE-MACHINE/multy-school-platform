import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, MenuItem, Grid, Alert } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import schoolService from '../../../services/schoolService';

export default function EditSchoolPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', slug: '', type: 'quranic' as 'quranic' | 'private' | 'kindergarten',
    phone: '', address: '', maxUsers: 100, maxMessages: 5000,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    schoolService.getBySlug(schoolId)
      .then((res) => {
        const s = res.data;
        setForm({
          name: s.name, slug: s.slug, type: s.type,
          phone: s.phone, address: s.address || '', maxUsers: s.maxUsers, maxMessages: s.maxMessages,
        });
      })
      .catch(() => setError(t('schools.failedToLoad')))
      .finally(() => setFetchLoading(false));
  }, [schoolId]);

  const handleChange = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await schoolService.update(form.slug, {
        name: form.name, phone: form.phone, address: form.address,
        maxUsers: form.maxUsers, maxMessages: form.maxMessages,
      });
      navigate(`/superAdmin/schools/${form.slug}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('schools.failedToUpdate'));
    } finally { setLoading(false); }
  };

  if (fetchLoading) return null;

  return (
    <Box>
      <PageHeader title={t('schools.editTitle', { name: form.name })} subtitle={t('schools.updateInfo')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" mb={2}>{t('schools.schoolInfo')}</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('schools.schoolName')} value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></Grid>
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
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.saving') : t('schools.saveChanges')}</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
