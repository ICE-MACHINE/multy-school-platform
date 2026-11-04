import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Divider, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import paymentService from '../../../services/paymentService';
import { formatMonthKey } from '../../../utils/arabicMonths';

export default function ReceiptPage() {
  const { t, i18n } = useTranslation();
  const { schoolId, id } = useParams<{ schoolId: string; id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && id) {
      paymentService.getReceipt(schoolId, id).then((res) => setData(res.data)).finally(() => setLoading(false));
    }
  }, [schoolId, id]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (!data) return <Typography p={4}>{t('payments.receiptNotFound')}</Typography>;

  return (
    <Box display="flex" justifyContent="center" p={4}>
      <Paper sx={{ maxWidth: 400, width: '100%', p: 4 }} id="receipt">
        <Typography variant="h5" fontWeight="bold" textAlign="center">{t('payments.receiptTitle')}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography textAlign="center" color="text.secondary" mb={2}>{data.schoolName}</Typography>
        <Box mb={2}>
          <Typography><b>{t('payments.receiptNumber')}</b> {data.receiptNumber}</Typography>
          <Typography><b>{t('payments.dateLabel')}</b> {new Date(data.paymentDate).toLocaleDateString(i18n.language)}</Typography>
          <Typography><b>{t('payments.studentLabel')}</b> {data.student ? `${data.student?.firstName} ${data.student?.lastName}` : (data.studentFullName || t('common.notAvailable'))}</Typography>
          {data.paymentType === 'month' && data.month && <Typography><b>{t('payments.monthLabel')}</b> {formatMonthKey(data.month)}</Typography>}
          {data.paymentType === 'session' && <Typography><b>{t('payments.sessionLabel')}</b> {t('payments.sessionNumberText', { number: data.sessionNumber })} {data.courseName ? `— ${data.courseName}` : ''}</Typography>}
          {data.paymentType === 'course' && <Typography><b>{t('payments.paymentLabel')}</b> {t('courses.fullCoursePayment')} {data.courseName ? `— ${data.courseName}` : ''}</Typography>}
          {data.month && data.paymentType !== 'month' && <Typography><b>{t('payments.monthLabel')}</b> {data.month}</Typography>}
          {data.description && <Typography><b>{t('payments.descriptionLabel')}</b> {data.description}</Typography>}
        </Box>
        <Divider />
        <Typography variant="h6" textAlign="center" mt={2}>{Number(data.amount).toLocaleString()} {t('common.currency')}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          {t('payments.printedAt', { date: new Date().toLocaleString(i18n.language) })}
        </Typography>
        <Box textAlign="center" mt={3}>
          <Button variant="contained" onClick={() => window.print()}>{t('common.print')}</Button>
        </Box>
      </Paper>
    </Box>
  );
}
