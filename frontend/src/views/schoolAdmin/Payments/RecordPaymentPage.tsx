import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box, TextField, Button, Grid, Alert, Autocomplete, Typography, Chip, MenuItem, Select,
  FormControl, InputLabel, Paper, CircularProgress,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StudentIcon from '@mui/icons-material/Person';
import MonthIcon from '@mui/icons-material/CalendarMonth';
import NotesIcon from '@mui/icons-material/Notes';
import MoneyIcon from '@mui/icons-material/Payments';
import PaidIcon from '@mui/icons-material/CheckCircle';
import PageHeader from '../../../components/common/PageHeader';
import DetailCard from '../../../components/common/DetailCard';
import { pillFieldSx } from '../../../components/common/filterStyles';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import paymentService from '../../../services/paymentService';
import studentService from '../../../services/studentService';
import { useSchool } from '../../../hooks/useSchool';
import { formatMonthKey } from '../../../utils/arabicMonths';
import type { Student, CoursePaymentStatus } from '../../../types';

const getTypeLabels = (t: TFunction): Record<string, string> => ({
  month: t('payments.monthly'),
  session: t('payments.perSession'),
  course: t('payments.perCourse'),
});

function monthOptions(startDate?: string): string[] {
  if (!startDate) return [];
  const start = new Date(startDate);
  const now = new Date();
  const keys: string[] = [];
  let y = start.getFullYear();
  let m = start.getMonth() + 1;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return keys;
}

export default function RecordPaymentPage() {
  const { t } = useTranslation();
  const TYPE_LABELS = getTypeLabels(t);
  const { schoolId } = useParams<{ schoolId: string }>();
  const [searchParams] = useSearchParams();
  const { currentSchool, schoolType } = useSchool();
  const navigate = useNavigate();
  const isPrivate = schoolType === 'private';

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentId, setStudentId] = useState(searchParams.get('studentId') || '');
  const [courseStatuses, setCourseStatuses] = useState<CoursePaymentStatus[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    setStudentsLoading(true);
    studentService.getAll(schoolId, { limit: 200 })
      .then((res) => { if (active) setStudents(res.data || []); })
      .catch(() => { if (active) setStudents([]); })
      .finally(() => { if (active) setStudentsLoading(false); });
    return () => { active = false; };
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !studentId) { setCourseStatuses([]); return; }
    if (isPrivate) {
      setCoursesLoading(true);
      paymentService.getStudentCoursePayments(schoolId, studentId)
        .then((res) => setCourseStatuses(res.data || []))
        .catch(() => setCourseStatuses([]))
        .finally(() => setCoursesLoading(false));
      setSelectedCourseId('');
      setSelectedMonth('');
      setSelectedSession('');
    }
  }, [schoolId, studentId, isPrivate]);

  useEffect(() => {
    if (!isPrivate || !selectedCourseId) return;
    const cs = courseStatuses.find((c) => c.course.id === selectedCourseId);
    if (cs?.paymentType === 'session' && cs.nextPayableSession != null && !selectedSession) {
      setSelectedSession(String(cs.nextPayableSession));
    }
  }, [selectedCourseId, courseStatuses, isPrivate, selectedSession]);

  const preselectedStudent = students.find((s) => s.id === studentId);
  const monthlyFee = currentSchool?.monthlyFee || 0;
  const isExemptStudent = !!preselectedStudent?.isExemptFromPayment;

  const submitPrivatePayment = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    if (!schoolId || !studentId) return;
    setLoading(true);
    setError('');
    const course = courseStatuses.find((c) => c.course.id === courseId);
    if (!course?.paymentType) { setError(t('payments.courseHasNoMethod')); setLoading(false); return; }
    const payload: any = { studentId, courseId, paymentType: course.paymentType, description };
    if (course.paymentType === 'month') {
      if (!selectedMonth) { setError(t('payments.choosePaidMonth')); setLoading(false); return; }
      payload.month = selectedMonth;
    } else if (course.paymentType === 'session') {
      if (!selectedSession) { setError(t('payments.chooseSessionNumber')); setLoading(false); return; }
      payload.sessionNumber = Number(selectedSession);
    }
    try {
      await paymentService.create(schoolId, payload);
      const res = await paymentService.getStudentCoursePayments(schoolId, studentId);
      setCourseStatuses(res.data || []);
      setSelectedCourseId('');
      setSelectedMonth('');
      setSelectedSession('');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('payments.failedRecord'));
    } finally { setLoading(false); }
  };

  const submitMonthlyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !studentId) return;
    setLoading(true);
    try {
      await paymentService.create(schoolId, { studentId, month, description });
      navigate(-1);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('common.failed'));
    } finally { setLoading(false); }
  };

  const submitCourse = (courseId: string, e?: React.FormEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!schoolId || !studentId) return;
    const course = courseStatuses.find((c) => c.course.id === courseId);
    if (!course || course.paymentType !== 'course') return;
    setLoading(true);
    setError('');
    paymentService.create(schoolId, { studentId, courseId, paymentType: 'course', description })
      .then(() => paymentService.getStudentCoursePayments(schoolId, studentId))
      .then((res) => setCourseStatuses(res.data || []))
      .catch((err: any) => setError(err?.response?.data?.message || t('payments.failedRecord')))
      .finally(() => setLoading(false));
  };

  return (
    <Box>
      <PageHeader title={t('payments.recordPayment')} subtitle={isPrivate ? t('payments.recordCoursePayment') : t('payments.recordMonthlyPayment')} />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {isExemptStudent ? (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={() => navigate(-1)}>{t('common.back')}</Button>
        }>
          {t('payments.exemptCannotPay')}
        </Alert>
      ) : null}

      {!isExemptStudent && (
      <DetailCard title={t('payments.paymentData')} icon={<ReceiptIcon />}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={students.filter((s) => !s.isExemptFromPayment)}
              value={preselectedStudent || null}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName}${o.registrationNumber ? ` (${o.registrationNumber})` : ''}`}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, v) => setStudentId(v?.id || '')}
              openOnFocus
              selectOnFocus
              noOptionsText={t('payments.noResults')}
              loading={studentsLoading}
              loadingText={t('common.loading')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('students.student')}
                  required
                  helperText={t('payments.searchStudentHelper')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}><StudentIcon fontSize="small" color="action" /></Box>),
                  }}
                  sx={pillFieldSx}
                />
              )}
            />
          </Grid>

          {isPrivate ? (
            <Grid size={{ xs: 12 }}>
              {!studentId ? (
                <Typography color="text.secondary" py={3} textAlign="center">{t('payments.chooseStudentCourses')}</Typography>
              ) : coursesLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : courseStatuses.length === 0 ? (
                <Alert severity="info">{t('payments.notEnrolledNoPayment')}</Alert>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {courseStatuses.map((cs) => {
                    const months = cs.paymentType === 'month' ? monthOptions(cs.course.startDate) : [];
                    const paidMonths = new Set(cs.paidMonths || []);
                    const completedSessions = new Set(cs.completedSessions || []);
                    const sessions = cs.paymentType === 'session'
                      ? Array.from({ length: cs.course.numberOfSessions || 0 }, (_, i) => i + 1)
                      : [];
                    const paidSessions = new Set(cs.paidSessions || []);
                    const isSelected = selectedCourseId === cs.course.id;

                    return (
                      <Paper key={cs.course.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1.5}>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography fontWeight={700}>{cs.course.name}</Typography>
                            <Chip size="small" label={cs.paymentType ? TYPE_LABELS[cs.paymentType] : t('payments.noPaymentMethod')}
                              color={cs.paymentType === 'month' ? 'primary' : cs.paymentType === 'session' ? 'secondary' : 'warning'} />
                            <Chip size="small" variant="outlined" label={t('payments.pricePer', { price: cs.price, suffix: cs.paymentType === 'month' ? t('payments.perMonthSuffix') : cs.paymentType === 'session' ? t('payments.perSessionSuffix') : '' })} />
                          </Box>
                          {cs.isPaid ? (
                            <Chip size="small" icon={<PaidIcon />} label={t('payments.fullyPaid')} color="success" />
                          ) : (
                            <Chip size="small" label={t('payments.paidCount', { paid: cs.paidCount, total: cs.totalRequired })} color="warning" variant="outlined" />
                          )}
                        </Box>

                        {cs.paymentType === 'course' && !cs.isPaid && (
                          <Button variant="contained" startIcon={<ReceiptIcon />} disabled={loading}
                            onClick={(e) => submitCourse(cs.course.id, e)}>
                            {t('payments.recordFullCourse', { price: cs.price })}
                          </Button>
                        )}

                        {cs.paymentType === 'course' && cs.isPaid && (
                          <Typography variant="body2" color="success.main">{t('payments.courseFullyPaid')}</Typography>
                        )}

                        {cs.paymentType === 'month' && (
                          <form onSubmit={(e) => submitPrivatePayment(e, cs.course.id)}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small" sx={pillFieldSx}>
                                  <InputLabel shrink>{t('common.month')}</InputLabel>
                                  <Select value={isSelected ? selectedMonth : ''} onChange={(e) => { setSelectedCourseId(cs.course.id); setSelectedMonth(e.target.value); }} displayEmpty label={t('common.month')}>
                                    <MenuItem value="" disabled>{t('payments.chooseMonth')}</MenuItem>
                                    {months.map((m) => (
                                      <MenuItem key={m} value={m} disabled={paidMonths.has(m)}>
                                        {formatMonthKey(m)}{paidMonths.has(m) ? t('payments.paidSuffix') : ''}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Button type="submit" variant="contained" startIcon={<ReceiptIcon />} disabled={loading || !isSelected || !selectedMonth} sx={{ borderRadius: 2 }}>
                                  {t('payments.recordMonthly', { price: cs.price })}
                                </Button>
                              </Grid>
                            </Grid>
                          </form>
                        )}

                        {cs.paymentType === 'session' && (
                          <form onSubmit={(e) => submitPrivatePayment(e, cs.course.id)}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small" sx={pillFieldSx}>
                                  <InputLabel shrink>{t('payments.sessionNumber')}</InputLabel>
                                  <Select value={isSelected ? selectedSession : ''} onChange={(e) => { setSelectedCourseId(cs.course.id); setSelectedSession(e.target.value); }} displayEmpty label={t('payments.sessionNumber')}>
                                    <MenuItem value="" disabled>{t('payments.chooseSession')}</MenuItem>
                                    {sessions.map((n) => {
                                      const paid = paidSessions.has(n);
                                      const completed = completedSessions.has(n);
                                      return (
                                        <MenuItem key={n} value={String(n)} disabled={paid || completed}>
                                          {t('payments.sessionText', { number: n })}{paid ? t('payments.sessionPaidSuffix') : completed ? t('payments.sessionCompletedSuffix') : ''}
                                        </MenuItem>
                                      );
                                    })}
                                  </Select>
                                </FormControl>
                                {cs.nextPayableSession != null && (
                                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                    {t('payments.nextDueSession', { number: cs.nextPayableSession })}
                                  </Typography>
                                )}
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Button type="submit" variant="contained" startIcon={<ReceiptIcon />} disabled={loading || !isSelected || !selectedSession} sx={{ borderRadius: 2 }}>
                                  {t('payments.recordSession', { price: cs.price })}
                                </Button>
                              </Grid>
                            </Grid>
                          </form>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Grid>
          ) : (
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label={t('payments.amountLabel')} value={t('payments.amountWithCurrency', { amount: monthlyFee })}
                  slotProps={{ input: { readOnly: true, startAdornment: <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}><MoneyIcon fontSize="small" color="action" /></Box> } }}
                  sx={pillFieldSx} />
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  {t('payments.monthlyFeeUnified')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label={t('common.month')} type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}><MonthIcon fontSize="small" color="action" /></Box> } }}
                  sx={pillFieldSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)}
                  slotProps={{ input: { startAdornment: <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}><NotesIcon fontSize="small" color="action" /></Box> } }}
                  sx={pillFieldSx} />
              </Grid>
            </>
          )}
        </Grid>

        {!isPrivate && preselectedStudent && (
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <Typography variant="caption" color="text.secondary">{t('payments.summary')}</Typography>
            <Chip size="small" label={`${preselectedStudent.firstName} ${preselectedStudent.lastName}`} />
            <Chip size="small" label={month} variant="outlined" />
            <Chip size="small" label={t('payments.amountWithCurrency', { amount: monthlyFee })} color="primary" />
          </Box>
        )}

        {!isPrivate && (
          <Box display="flex" gap={2} justifyContent="flex-end" mt={3.5}>
            <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" startIcon={<ReceiptIcon />} disabled={loading} sx={{ borderRadius: 2 }} onClick={submitMonthlyPayment}>
              {loading ? t('payments.recording') : t('payments.recordPaymentTitle')}
            </Button>
          </Box>
        )}
      </DetailCard>
      )}
    </Box>
  );
}
