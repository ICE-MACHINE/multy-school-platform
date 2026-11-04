import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Alert, Chip, Stack } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import PaidIcon from '@mui/icons-material/CheckCircle';
import DataTable, { type Column } from '../../../../components/common/DataTable';
import paymentService from '../../../../services/paymentService';
import studentService from '../../../../services/studentService';
import { useSchool } from '../../../../hooks/useSchool';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { paymentPeriodLabel } from '../../../../utils/paymentLabels';
import type { Payment, Student, CoursePaymentStatus } from '../../../../types';

const getTypeLabels = (t: TFunction): Record<string, string> => ({ month: t('payments.monthly'), session: t('payments.perSession'), course: t('payments.perCourse') });

export default function PaymentSection({ student, onUpdate }: { student: Student; onUpdate?: () => void }) {
  const { t } = useTranslation();
  const TYPE_LABELS = getTypeLabels(t);
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courseStatuses, setCourseStatuses] = useState<CoursePaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (schoolId) paymentService.getByStudent(schoolId, student.id).then((res) => setPayments(res.data || [])).finally(() => setLoading(false));
    if (schoolId && isPrivate) paymentService.getStudentCoursePayments(schoolId, student.id).then((res) => setCourseStatuses(res.data || [])).catch(() => setCourseStatuses([]));
  }, [schoolId, student.id, isPrivate]);

  const totalPaid = payments.filter((p) => !p.refunded).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = payments.filter((p) => p.refunded).reduce((sum, p) => sum + Number(p.amount), 0);

  const handleToggleExemption = async () => {
    if (!schoolId) return;
    setToggleLoading(true);
    setNotice(null);
    try {
      await studentService.toggleExemption(schoolId, student.id);
      setNotice({ type: 'success', text: t('payments.exemptionUpdated') });
      onUpdate?.();
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.response?.data?.message || t('payments.failedExemption') });
    } finally { setToggleLoading(false); }
  };

  const periodLabel = (r: Payment): string => paymentPeriodLabel(r, t);

  const columns: Column<Payment>[] = [
    { id: 'date', label: t('common.date'), accessor: (r) => new Date(r.paymentDate).toLocaleDateString() },
    { id: 'period', label: t('students.period'), accessor: (r) => periodLabel(r) },
    { id: 'receipt', label: t('payments.receipt'), accessor: (r) => r.receiptNumber || '-' },
    { id: 'amount', label: t('payments.amount'), accessor: (r) => (
      <Typography fontWeight={600} sx={{ textDecoration: r.refunded ? 'line-through' : 'none', color: r.refunded ? 'text.disabled' : undefined }}>
        {r.amount} {t('common.currency')}
      </Typography>
    ) },
    { id: 'status', label: t('common.status'), sortable: false, accessor: (r) =>
      r.refunded
        ? <Chip size="small" label={t('payments.refunded')} color="default" variant="outlined" sx={{ color: 'error.main', borderColor: 'error.main' }} />
        : <Chip size="small" label={t('payments.paid')} color="success" variant="outlined" />,
    },
    { id: 'actions', label: '', sortable: false, accessor: (r) =>
      <Button size="small" startIcon={<ReceiptIcon />} onClick={() => window.open(`/s/${schoolId}/admin/payments/receipt/${r.id}`, '_blank')}>
        {t('payments.receipt')}
      </Button>,
    },
  ];

  const exemptionToggle = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        p: 0.4,
        bgcolor: 'action.hover',
        borderRadius: 999,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        onClick={handleToggleExemption}
        sx={{
          px: 1.6,
          py: 0.6,
          borderRadius: 999,
          cursor: toggleLoading ? 'not-allowed' : 'pointer',
          opacity: toggleLoading ? 0.7 : 1,
          bgcolor: !student.isExemptFromPayment ? 'primary.main' : 'transparent',
          color: !student.isExemptFromPayment ? '#fff' : 'text.secondary',
          fontWeight: 700,
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { bgcolor: !student.isExemptFromPayment ? 'primary.main' : 'action.selected' },
        }}
      >
        {t('payments.activePayer')}
      </Box>
      <Box
        onClick={handleToggleExemption}
        sx={{
          px: 1.6,
          py: 0.6,
          borderRadius: 999,
          cursor: toggleLoading ? 'not-allowed' : 'pointer',
          opacity: toggleLoading ? 0.7 : 1,
          bgcolor: student.isExemptFromPayment ? 'warning.main' : 'transparent',
          color: student.isExemptFromPayment ? '#fff' : 'text.secondary',
          fontWeight: 700,
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { bgcolor: student.isExemptFromPayment ? 'warning.main' : 'action.selected' },
        }}
      >
        {t('payments.exemptFromPayment')}
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <Box display="flex" gap={1.5} alignItems="center">
          <Typography variant="h6">{t('payments.totalPaid', { amount: totalPaid })}</Typography>
          {totalRefunded > 0 && <Chip size="small" label={t('payments.refundedChip', { amount: totalRefunded })} variant="outlined" sx={{ color: 'error.main', borderColor: 'error.main' }} />}
        </Box>
        <Box display="flex" gap={1.5} alignItems="center">
          <Button
            variant="contained"
            size="small"
            disabled={!!student.isExemptFromPayment}
            onClick={() => navigate(`/s/${schoolId}/admin/payments/record?studentId=${student.id}`)}
          >
            {t('payments.addPayment')}
          </Button>
          {!isPrivate && exemptionToggle}
        </Box>
      </Box>

      {notice && <Alert severity={notice.type} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      {isPrivate && courseStatuses.length > 0 && (
        <Stack spacing={1} mb={2}>
          {courseStatuses.map((cs) => (
            <Box key={cs.course.id} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} p={1.5} borderRadius={2} border="1px solid" borderColor="divider">
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography fontWeight={600}>{cs.course.name}</Typography>
                <Chip size="small" label={cs.paymentType ? TYPE_LABELS[cs.paymentType] : t('payments.noPaymentMethod')}
                  color={cs.paymentType === 'month' ? 'primary' : cs.paymentType === 'session' ? 'secondary' : 'warning'} />
                <Chip size="small" variant="outlined" label={t('payments.pricePer', { price: cs.price, suffix: cs.paymentType === 'month' ? t('payments.perMonthSuffix') : cs.paymentType === 'session' ? t('payments.perSessionSuffix') : '' })} />
              </Box>
              {cs.isPaid
                ? <Chip size="small" icon={<PaidIcon />} label={t('payments.fullyPaid')} color="success" />
                : <Chip size="small" label={t('payments.paidCount', { paid: cs.paidCount, total: cs.totalRequired })} color="warning" variant="outlined" />}
            </Box>
          ))}
        </Stack>
      )}

      {isPrivate && courseStatuses.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>{t('payments.notEnrolledNoPayment')}</Alert>
      )}

      {!isPrivate && <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.8125rem' } }}>
        <strong>{t('payments.exemptionRulesTitle')}</strong> {t('payments.exemptionRules')}
      </Alert>}

      <DataTable columns={columns} data={payments} keyExtractor={(r) => r.id} loading={loading} searchable={false} />
    </Box>
  );
}
