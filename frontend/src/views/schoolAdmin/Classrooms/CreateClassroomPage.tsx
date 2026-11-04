import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Grid, Alert } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import classroomService from '../../../services/classroomService';

export default function CreateClassroomPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);
    try { await classroomService.create(schoolId, { name, capacity }); navigate(-1); }
    catch (err: any) { setError(err?.response?.data?.message || t('common.failed')); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <PageHeader title={t('classrooms.addClassroom')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card><CardContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('classrooms.name')} value={name} onChange={(e) => setName(e.target.value)} required /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('courses.capacity')} type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required /></Grid>
          </Grid>
          <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
            <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.creating') : t('common.create')}</Button>
          </Box>
        </Box>
      </CardContent></Card>
    </Box>
  );
}
