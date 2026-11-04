import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Divider, CircularProgress, Alert,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useTranslation } from 'react-i18next';
import paymentService from '../../../services/paymentService';
import { formatMonthKey } from '../../../utils/arabicMonths';
import type { Payment } from '../../../types';

export default function PaymentsReportPage() {
  const { t, i18n } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [searchParams] = useSearchParams();
  const monthsParam = searchParams.get('months') || '';
  const [data, setData] = useState<{ schoolName: string; data: Payment[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const months = monthsParam.split(',').map((m) => m.trim()).filter(Boolean);
    paymentService.getForPrint(schoolId, months)
      .then((res) => setData(res.data))
      .catch(() => setData({ schoolName: '', data: [] }))
      .finally(() => setLoading(false));
  }, [schoolId, monthsParam]);

  const grouped = useMemo(() => {
    if (!data?.data) return [] as [string, Payment[]][];
    const map = new Map<string, Payment[]>();
    for (const p of data.data) {
      const key = p.month || t('payments.noPeriod');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const totalAmount = useMemo(() => (data?.data || []).reduce((sum, p) => sum + Number(p.amount), 0), [data]);

  const monthSubtotal = (items: Payment[]) => items.reduce((sum, p) => sum + Number(p.amount), 0);

  const studentName = (p: Payment) =>
    p.student ? `${p.student.firstName} ${p.student.lastName}` : (p.studentFullName || t('common.notAvailable'));

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  }

  const hasData = !!data?.data?.length;

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box textAlign="center" mb={3} className="no-print">
        <Button variant="contained" size="large" startIcon={<PrintIcon />} onClick={() => window.print()}>{t('common.print')}</Button>
      </Box>

      {!hasData ? (
        <Paper sx={{ maxWidth: 500, mx: 'auto', p: 4, textAlign: 'center' }}>
          <Alert severity="info">{t('payments.noPaymentsInPeriod')}</Alert>
        </Paper>
      ) : (
        <Paper sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 4 } }}>
          <Typography variant="h4" fontWeight={800} textAlign="center">{data.schoolName}</Typography>
          <Typography variant="h6" fontWeight={600} textAlign="center" mt={0.5}>{t('payments.reportTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
            {t('payments.periodLabel', { period: grouped.map(([m]) => (m === t('payments.noPeriod') ? m : formatMonthKey(m))).join(' - ') })}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
            <Typography variant="body1" fontWeight={600}>{t('payments.grandTotalLabel')}</Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main">{totalAmount.toLocaleString()} {t('common.currency')}</Typography>
          </Box>

          {grouped.map(([month, items]) => (
            <Box key={month} mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>{month === t('payments.noPeriod') ? month : formatMonthKey(month)}</Typography>
                <Typography variant="body1" fontWeight={700}>{monthSubtotal(items).toLocaleString()} {t('common.currency')}</Typography>
              </Box>
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#eef2ff' }}>
                      <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('payments.fullStudentName')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">{t('payments.amountDzdHeader')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">{t('payments.paymentDate')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((p, i) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{studentName(p)}</TableCell>
                        <TableCell align="center">{Number(p.amount).toLocaleString()}</TableCell>
                        <TableCell align="center">{new Date(p.paymentDate).toLocaleDateString(i18n.language)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            {t('payments.printedAt', { date: new Date().toLocaleString(i18n.language) })}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
