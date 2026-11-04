import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, MenuItem, Grid, Alert, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import parentService from '../../../services/parentService';

export default function CreateParentPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', placeOfResidence: '', gender: 'male', phone: '', password: '' });
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
      await parentService.create(schoolId, form);
      navigate(`/s/${schoolId}/admin/parents`);
    } catch (err: any) { setError(err?.response?.data?.message || t('parents.failedToCreate')); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <PageHeader title={t('parents.addParent')} subtitle={t('parents.registerNew')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.firstName')} value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('students.lastName')} value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('parents.placeOfResidence')} value={form.placeOfResidence} onChange={(e) => handleChange('placeOfResidence', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={t('common.gender')} value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}><MenuItem value="male">{t('common.male')}</MenuItem><MenuItem value="female">{t('common.female')}</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('common.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t('auth.password')} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} required
                  slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
              </Grid>
            </Grid>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.creating') : t('parents.createParent')}</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
