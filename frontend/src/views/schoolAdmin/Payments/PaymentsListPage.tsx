import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, InputAdornment, MenuItem, Chip } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PrintIcon from '@mui/icons-material/Print';
import PaymentsIcon from '@mui/icons-material/Payments';
import PageHeader from '../../../components/common/PageHeader';
import FilterRow from '../../../components/common/FilterBar';
import { pillFieldSx } from '../../../components/common/filterStyles';
import DataTable, { type Column } from '../../../components/common/DataTable';
import paymentService from '../../../services/paymentService';
import PaymentsPrintDialog from './PaymentsPrintDialog';
import { useTranslation } from 'react-i18next';
import { paymentPeriodLabel } from '../../../utils/paymentLabels';
import type { Payment } from '../../../types';

const MONTHS = ['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export default function PaymentsListPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [printOpen, setPrintOpen] = useState(false);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params: any = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (monthFilter) params.month = monthFilter;
      const res = await paymentService.getAll(schoolId, params);
      setPayments(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalAmount(Number(res.pagination?.totalAmount || 0));
    } catch {} finally { setLoading(false); }
  }, [schoolId, page, rowsPerPage, search, monthFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const isDeletedStudent = (r: Payment) => !r.student && !!r.studentFullName;

  const columns: Column<Payment>[] = [
    { id: 'student', label: t('students.student'), accessor: (r) => {
      if (r.student) return `${r.student.firstName} ${r.student.lastName}`;
      if (r.studentFullName) {
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <span>{r.studentFullName}</span>
            <Chip size="small" icon={<PersonOffIcon />} label={t('payments.deletedAccount')} sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 600, height: 20, '& .MuiChip-label': { px: 0.75 } }} />
          </Box>
        );
      }
      return t('common.notAvailable');
    } },
    { id: 'period', label: t('students.period'), accessor: (r) => paymentPeriodLabel(r, t) },
    { id: 'amount', label: t('payments.amount'), accessor: (r) => (
      <Typography fontWeight={600} sx={{ textDecoration: r.refunded ? 'line-through' : 'none', color: r.refunded ? 'text.disabled' : undefined }}>
        {r.amount} {t('common.currency')}
      </Typography>
    ) },
    { id: 'status', label: t('common.status'), sortable: false, accessor: (r) =>
      r.refunded
        ? <Chip size="small" label={t('payments.refunded')} variant="outlined" sx={{ color: 'error.main', borderColor: 'error.main' }} />
        : <Chip size="small" label={t('payments.paid')} color="success" variant="outlined" />,
    },
    { id: 'receipt', label: t('payments.receipt'), accessor: (r) => r.receiptNumber || '-' },
    { id: 'date', label: t('common.date'), accessor: (r) => new Date(r.paymentDate).toLocaleDateString() },
    { id: 'actions', label: '', sortable: false, accessor: (r) =>
      <Button size="small" startIcon={<ReceiptIcon />} onClick={() => window.open(`/s/${schoolId}/admin/payments/receipt/${r.id}`, '_blank')}>
        {t('payments.receipt')}
      </Button>,
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <Box>
      <PageHeader
        title={t('payments.payments')}
        action={
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => setPrintOpen(true)}
              sx={{
                borderColor: 'divider',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
            >
              {t('payments.printPayments')}
            </Button>
            <Button variant="contained" startIcon={<ReceiptIcon />} onClick={() => navigate(`/s/${schoolId}/admin/payments/record`)}>
              {t('payments.recordPaymentTitle')}
            </Button>
          </Box>
        }
      />

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: 4,
          mb: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%)',
          color: '#fff',
          boxShadow: '0 12px 30px rgba(99, 102, 241, 0.35)',
          animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.14)',
          },
          '&::before': { width: 220, height: 220, top: -90, left: -60, },
          '&::after': { width: 160, height: 160, bottom: -70, right: -40 },
        }}
      >
        <Box position="relative" zIndex={1} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PaymentsIcon />
              </Box>
              <Typography variant="body1" fontWeight={600} sx={{ opacity: 0.95 }}>{t('payments.grandTotal')}</Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
              {totalAmount.toLocaleString()} <Typography component="span" variant="h6" fontWeight={600} sx={{ opacity: 0.9 }}>{t('common.currency')}</Typography>
            </Typography>
          </Box>
          <Box textAlign="left">
            <Typography variant="h6" fontWeight={700}>{t('payments.paymentsCount', { count: total })}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{t('payments.afterFilters')}</Typography>
          </Box>
        </Box>
      </Box>

      <FilterRow>
        <TextField size="small" placeholder={t('common.search')} value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, ...pillFieldSx }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        <TextField select size="small" sx={{ minWidth: 140, ...pillFieldSx }} value={monthFilter}
          onChange={(e) => { setMonthFilter(e.target.value); setPage(0); }}
          slotProps={{ select: { displayEmpty: true } }}>
          <MenuItem value="">{t('students.allMonths')}</MenuItem>
          {MONTHS.filter(Boolean).map((m) => (
            <MenuItem key={m} value={`${currentYear}-${m}`}>{`${currentYear}-${m}`}</MenuItem>
          ))}
        </TextField>
      </FilterRow>
      <DataTable columns={columns} data={payments} keyExtractor={(r) => r.id} loading={loading} searchable={false}
        rowSx={(r) => (isDeletedStudent(r) ? { borderLeft: '2px solid #dc2626', bgcolor: 'rgba(220, 38, 38, 0.04)' } : {})}
        page={page} rowsPerPage={rowsPerPage} totalRows={total}
        onPageChange={(p) => setPage(p)} onRowsPerPageChange={(l) => { setRowsPerPage(l); setPage(0); }} />

      {schoolId && <PaymentsPrintDialog open={printOpen} schoolId={schoolId} onClose={() => setPrintOpen(false)} />}
    </Box>
  );
}
