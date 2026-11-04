import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Grid, Alert, FormControlLabel, Radio, RadioGroup, FormControl, FormLabel, Checkbox, FormGroup, Typography } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import courseService from '../../../services/courseService';
import { useSchool } from '../../../hooks/useSchool';

type PaymentMethod = 'month' | 'session' | 'course';

export default function CreateCoursePage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [form, setForm] = useState({
    name: '',
    description: '',
    capacity: 30,
    hasMonthOption: true,
    hasSessionOption: false,
    hasCourseOption: false,
    pricePerMonth: 0,
    pricePerSession: 0,
    pricePerCourse: 0,
    startDate: '',
    numberOfSessions: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const setPrivateMethod = (method: PaymentMethod) => {
    setForm((p) => ({
      ...p,
      hasMonthOption: method === 'month',
      hasSessionOption: method === 'session',
      hasCourseOption: method === 'course',
    }));
  };

  const privateMethod: PaymentMethod = form.hasCourseOption ? 'course' : form.hasSessionOption ? 'session' : 'month';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        capacity: form.capacity,
      };
      if (isPrivate) {
        payload.hasMonthOption = form.hasMonthOption;
        payload.hasSessionOption = form.hasSessionOption;
        payload.hasCourseOption = form.hasCourseOption;
        payload.pricePerMonth = form.hasMonthOption ? Number(form.pricePerMonth) : undefined;
        payload.pricePerSession = form.hasSessionOption ? Number(form.pricePerSession) : undefined;
        payload.pricePerCourse = form.hasCourseOption ? Number(form.pricePerCourse) : undefined;
        payload.startDate = form.hasMonthOption ? form.startDate : undefined;
        payload.numberOfSessions = form.hasSessionOption ? Number(form.numberOfSessions) : undefined;
      } else {
        payload.hasMonthOption = form.hasMonthOption;
        payload.hasSessionOption = form.hasSessionOption;
        payload.hasCourseOption = form.hasCourseOption;
        payload.pricePerMonth = form.hasMonthOption ? Number(form.pricePerMonth) : undefined;
        payload.pricePerSession = form.hasSessionOption ? Number(form.pricePerSession) : undefined;
        payload.pricePerCourse = form.hasCourseOption ? Number(form.pricePerCourse) : undefined;
      }
      await courseService.create(schoolId, payload);
      navigate(-1);
    }
    catch (err: any) { setError(err?.response?.data?.message || t('common.failed')); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <PageHeader title={t('courses.addCourseTitle')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Card><CardContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('courses.courseName')} value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={t('courses.capacity')} type="number" value={form.capacity} onChange={(e) => handleChange('capacity', Number(e.target.value))} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label={t('common.description')} value={form.description} onChange={(e) => handleChange('description', e.target.value)} multiline rows={2} /></Grid>

            {isPrivate ? (
              <>
                <Grid size={{ xs: 12 }}>
                  <FormControl component="fieldset">
                    <FormLabel>{t('payments.paymentType')}</FormLabel>
                    <RadioGroup value={privateMethod} onChange={(e) => setPrivateMethod(e.target.value as PaymentMethod)} row>
                      <FormControlLabel value="month" control={<Radio />} label={t('courses.monthlyFromStart')} />
                      <FormControlLabel value="session" control={<Radio />} label={t('payments.perSession')} />
                      <FormControlLabel value="course" control={<Radio />} label={t('courses.perCourseFull')} />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                {privateMethod === 'month' && (
                  <>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.pricePerMonth')} type="number" value={form.pricePerMonth} onChange={(e) => handleChange('pricePerMonth', Number(e.target.value))} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.courseStartDate')} type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
                  </>
                )}
                {privateMethod === 'session' && (
                  <>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.pricePerSession')} type="number" value={form.pricePerSession} onChange={(e) => handleChange('pricePerSession', Number(e.target.value))} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.numberOfSessions')} type="number" value={form.numberOfSessions} onChange={(e) => handleChange('numberOfSessions', Number(e.target.value))} /></Grid>
                  </>
                )}
                {privateMethod === 'course' && (
                  <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.pricePerCourseFull')} type="number" value={form.pricePerCourse} onChange={(e) => handleChange('pricePerCourse', Number(e.target.value))} /></Grid>
                )}
              </>
            ) : (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" mb={1}>{t('courses.pricingOptions')}</Typography>
                  <FormGroup row>
                    <FormControlLabel control={<Checkbox checked={form.hasMonthOption} onChange={(e) => handleChange('hasMonthOption', e.target.checked)} />} label={t('payments.monthly')} />
                    <FormControlLabel control={<Checkbox checked={form.hasSessionOption} onChange={(e) => handleChange('hasSessionOption', e.target.checked)} />} label={t('courses.perSessionOption')} />
                    <FormControlLabel control={<Checkbox checked={form.hasCourseOption} onChange={(e) => handleChange('hasCourseOption', e.target.checked)} />} label={t('courses.perSubjectOption')} />
                  </FormGroup>
                </Grid>
                {form.hasMonthOption && <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.pricePerMonth')} type="number" value={form.pricePerMonth} onChange={(e) => handleChange('pricePerMonth', Number(e.target.value))} /></Grid>}
                {form.hasSessionOption && <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.pricePerSessionAlt')} type="number" value={form.pricePerSession} onChange={(e) => handleChange('pricePerSession', Number(e.target.value))} /></Grid>}
                {form.hasCourseOption && <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label={t('courses.pricePerSubject')} type="number" value={form.pricePerCourse} onChange={(e) => handleChange('pricePerCourse', Number(e.target.value))} /></Grid>}
              </>
            )}
          </Grid>
          <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
            <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? t('common.creating') : t('courses.createCourse')}</Button>
          </Box>
        </Box>
      </CardContent></Card>
    </Box>
  );
}
