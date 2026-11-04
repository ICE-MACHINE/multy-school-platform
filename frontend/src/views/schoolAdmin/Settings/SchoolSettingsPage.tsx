import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Grid, Alert } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import schoolService from '../../../services/schoolService';
import { useSchool } from '../../../hooks/useSchool';

export default function SchoolSettingsPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { currentSchool, setSchool } = useSchool();
  const [monthlyFee, setMonthlyFee] = useState(currentSchool?.monthlyFee || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMonthlyFee(currentSchool?.monthlyFee || 0);
  }, [currentSchool]);

  const handleSave = async () => {
    if (!schoolId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await schoolService.updateSettings(schoolId, { monthlyFee });
      setSchool(res.data);
      setSuccess(t('settings.updatedSuccess'));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('settings.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title={t('settings.schoolSettings')} subtitle={t('settings.editDefaults')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('settings.monthlyFeeLabel')} type="number"
                value={monthlyFee} onChange={(e) => setMonthlyFee(Number(e.target.value))}
                helperText={t('settings.monthlyFeeHelper')} />
            </Grid>
          </Grid>
          <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : t('settings.saveSettings')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
