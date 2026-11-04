import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Checkbox, FormControlLabel, FormGroup, Typography, Alert,
  Chip, Divider, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import paymentService from '../../../services/paymentService';
import { formatMonthLabel, MONTH_KEYS } from '../../../utils/arabicMonths';

interface PaymentsPrintDialogProps {
  open: boolean;
  schoolId: string;
  onClose: () => void;
}

export default function PaymentsPrintDialog({ open, schoolId, onClose }: PaymentsPrintDialogProps) {
  const { t } = useTranslation();
  const [monthsInfo, setMonthsInfo] = useState<{ month: string; count: number }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSelected([]);
    setLoading(true);
    paymentService.getPrintMonths(schoolId)
      .then((res) => setMonthsInfo(res.data || []))
      .catch(() => setMonthsInfo([]))
      .finally(() => setLoading(false));
  }, [open, schoolId]);

  const countMap = useMemo(() => new Map(monthsInfo.map((m) => [m.month, m.count])), [monthsInfo]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const set = new Set<string>([
      String(now - 2), String(now - 1), String(now),
      ...monthsInfo.map((m) => m.month.slice(0, 4)),
    ]);
    return Array.from(set).sort();
  }, [monthsInfo]);

  const yearMonths = (year: string) => MONTH_KEYS.map((mm) => `${year}-${mm}`);

  const toggleMonth = (monthKey: string) => {
    setSelected((prev) => prev.includes(monthKey) ? prev.filter((m) => m !== monthKey) : [...prev, monthKey]);
  };

  const toggleYear = (year: string) => {
    const all = yearMonths(year);
    const hasAll = all.every((m) => selected.includes(m));
    setSelected((prev) => hasAll ? prev.filter((m) => !all.includes(m)) : Array.from(new Set([...prev, ...all])));
  };

  const isYearSelected = (year: string) => yearMonths(year).every((m) => selected.includes(m));

  const totalFor = (months: string[]) => months.reduce((sum, m) => sum + (countMap.get(m) || 0), 0);

  const handlePrint = async () => {
    if (!selected.length) {
      setError(t('payments.chooseMonths'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const sorted = [...selected].sort();
      const res = await paymentService.getForPrint(schoolId, sorted);
      if (!res.data?.data?.length) {
        setError(t('payments.emptyPeriod'));
        return;
      }
      window.open(`/s/${schoolId}/admin/payments/print?months=${encodeURIComponent(sorted.join(','))}`, '_blank');
      onClose();
    } catch {
      setError(t('payments.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{
        paper: { sx: { transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important' } },
      }}>
      <DialogTitle component="div">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>{t('payments.printPayments')}</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ minHeight: 280 }}>
        {loading && !monthsInfo.length ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('payments.printDesc')}
            </Typography>
            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
            {years.map((year) => {
              const months = yearMonths(year);
              const hasAny = months.some((m) => countMap.has(m));
              return (
                <Box key={year} mb={2}>
                  <FormControlLabel
                    control={<Checkbox checked={isYearSelected(year)} onChange={() => toggleYear(year)} />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight={700}>{t('payments.yearLabel', { year })}</Typography>
                        {hasAny && (
                          <Chip size="small" label={t('payments.paymentsCount', { count: totalFor(months) })}
                            sx={{ bgcolor: '#eef2ff', color: '#4f46e5', fontWeight: 600, height: 20, '& .MuiChip-label': { px: 1 } }} />
                        )}
                      </Box>
                    }
                  />
                  <FormGroup row sx={{ pr: 4 }}>
                    {months.map((key) => {
                      const count = countMap.get(key);
                      return (
                        <FormControlLabel
                          key={key}
                          sx={{ minWidth: 130 }}
                          control={<Checkbox size="small" checked={selected.includes(key)} onChange={() => toggleMonth(key)} />}
                          label={
                            <Typography variant="body2">
                              {formatMonthLabel(key.slice(5, 7))} {year}
                              {count !== undefined && <Typography component="span" variant="caption" color="text.secondary"> ({count})</Typography>}
                            </Typography>
                          }
                        />
                      );
                    })}
                  </FormGroup>
                </Box>
              );
            })}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Typography variant="body2" color="text.secondary" flex={1}>
          {selected.length > 0 && t('payments.selectedMonths', { count: selected.length })}
        </Typography>
        <Button onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handlePrint} disabled={loading}>
          {loading ? t('payments.verifying') : t('common.print')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
