import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, IconButton, Alert, Snackbar,
  CircularProgress, Divider, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import AccessTime from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageHeader from '../../../components/common/PageHeader';
import GlassSurface from '../../../components/common/GlassSurface';
import GlassCard from '../../../components/common/GlassCard';
import { useTranslation } from 'react-i18next';
import timetableService from '../../../services/timetableService';
import type { TimetableSettings, DayOfWeek } from '../../../types';
import { DAY_LABELS } from '../../../types';

const ALL_DAYS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const DAY_COLORS: Record<DayOfWeek, string> = {
  saturday: '#6366f1', sunday: '#8b5cf6', monday: '#ec4899', tuesday: '#f43f5e',
  wednesday: '#f97316', thursday: '#22c55e', friday: '#06b6d4',
};

interface PeriodForm {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

const emptyPeriod = (): PeriodForm => ({ id: crypto.randomUUID(), label: '', startTime: '08:00', endTime: '09:00' });

export default function TimetableSettingsPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TimetableSettings | null>(null);
  const [studyDays, setStudyDays] = useState<DayOfWeek[]>([]);
  const [periods, setPeriods] = useState<PeriodForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await timetableService.getSettings(schoolId);
      const s = res.data;
      setSettings(s);
      setStudyDays(s.studyDays || []);
      setPeriods(s.periods?.map(p => ({ id: p.id || crypto.randomUUID(), label: p.label, startTime: p.startTime, endTime: p.endTime })) || []);
    } catch { /* first time, no settings yet */ }
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggleDay = (day: DayOfWeek) => {
    setStudyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const selectAllDays = () => setStudyDays([...ALL_DAYS]);
  const clearDays = () => setStudyDays([]);

  const addPeriod = () => setPeriods(prev => [...prev, emptyPeriod()]);
  const removePeriod = (i: number) => setPeriods(prev => prev.filter((_, idx) => idx !== i));
  const updatePeriod = (i: number, field: keyof PeriodForm, value: string) => {
    setPeriods(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (!schoolId) return;
    if (studyDays.length === 0) { setMsg({ type: 'error', text: t('timetable.chooseDay') }); return; }
    if (periods.length === 0) { setMsg({ type: 'error', text: t('timetable.addOnePeriod') }); return; }
    for (const p of periods) {
      if (!p.label.trim()) { setMsg({ type: 'error', text: t('timetable.allPeriodsNamed') }); return; }
    }
    setSaving(true);
    try {
      await timetableService.updateSettings(schoolId, { studyDays, periods });
      setMsg({ type: 'success', text: t('timetable.settingsSaved') });
      fetchSettings();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || t('timetable.couldNotSave') });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={12}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={t('timetable.settingsTitle')}
        subtitle={t('timetable.settingsSubtitle')}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/s/${schoolId}/admin/timetable`)}
            sx={{
              borderRadius: 2, fontWeight: 600, textTransform: 'none',
              borderColor: 'rgba(16,24,40,0.15)',
              '&:hover': {
                borderColor: '#6366f1',
                bgcolor: 'rgba(99, 102, 241, 0.04)',
              },
            }}
          >
            {t('timetable.backToTimetable')}
          </Button>
        }
      />

      {/* Study Days Section */}
      <GlassCard
        sx={{
          mb: 3,
          p: 0,
          overflow: 'hidden',
          animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Section Header */}
        <Box sx={{ px: 3.5, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
            }}
          >
            <CalendarMonth fontSize="small" />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {t('timetable.studyDays')}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
              {t('timetable.toggleDayHint')}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title={t('timetable.selectAll')}>
              <Button size="small" variant="text" onClick={selectAllDays}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}>
                {t('common.all')}
              </Button>
            </Tooltip>
            <Tooltip title={t('timetable.clearAll')}>
              <Button size="small" variant="text" color="error" onClick={clearDays}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}>
                {t('timetable.clear')}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Divider />

        {/* Day Chips */}
        <Box display="flex" flexWrap="wrap" gap={1.5} sx={{ px: 3.5, py: 2.5 }}>
          {ALL_DAYS.map((day, idx) => {
            const active = studyDays.includes(day);
            const color = DAY_COLORS[day];
            return (
              <Tooltip key={day} title={t(`timetable.days.${day}`, { defaultValue: DAY_LABELS[day] })} arrow>
                <Box
                  onClick={() => toggleDay(day)}
                  sx={{
                    width: 72, height: 72, borderRadius: 3,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 0.5,
                    cursor: 'pointer',
                    border: `2px solid ${active ? color : 'rgba(16,24,40,0.08)'}`,
                    bgcolor: active ? `${color}12` : 'transparent',
                    transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    animation: `fadeInUp 300ms ${idx * 40}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 16px ${color}30`,
                      borderColor: color,
                    },
                    '&:active': { transform: 'scale(0.95)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: active ? color : 'rgba(16,24,40,0.05)',
                      color: active ? '#fff' : 'text.secondary',
                      fontSize: '0.75rem', fontWeight: 700,
                      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {t(`timetable.days.${day}`, { defaultValue: DAY_LABELS[day] }).charAt(0)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600, fontSize: '0.65rem',
                      color: active ? color : 'text.secondary',
                      transition: 'color 200ms',
                    }}
                  >
                    {t(`timetable.days.${day}`, { defaultValue: DAY_LABELS[day] })}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Summary */}
        <Box sx={{ px: 3.5, pb: 2.5, pt: 0 }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              px: 2, py: 0.75, borderRadius: 2,
              bgcolor: studyDays.length > 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(218, 30, 40, 0.06)',
              border: `1px solid ${studyDays.length > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(218, 30, 40, 0.15)'}`,
            }}
          >
            <CheckCircleOutline sx={{ fontSize: 16, color: studyDays.length > 0 ? '#22c55e' : '#da1e28' }} />
            <Typography variant="caption" fontWeight={600} color={studyDays.length > 0 ? '#22c55e' : '#da1e28'}>
              {studyDays.length > 0
                ? t('timetable.studyDaysSelected', { count: studyDays.length })
                : t('timetable.noDaySelected')}
            </Typography>
          </Box>
        </Box>
      </GlassCard>

      {/* Periods Section */}
      <GlassCard
        sx={{
          mb: 3,
          p: 0,
          overflow: 'hidden',
          animation: 'fadeInUp 300ms 100ms cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Section Header */}
        <Box sx={{ px: 3.5, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6',
            }}
          >
            <AccessTime fontSize="small" />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {t('timetable.periods')}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
              {t('timetable.periodsHint')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addPeriod}
            sx={{
              borderRadius: 2, fontWeight: 600, textTransform: 'none',
              px: 2, py: 0.75,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
              '&:hover': { boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)' },
            }}
          >
            {t('timetable.addPeriod')}
          </Button>
        </Box>

        <Divider />

        {/* Periods List */}
        <Box sx={{ px: 3.5, py: 2.5 }}>
          {periods.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center', py: 5,
                borderRadius: 3,
                border: '2px dashed rgba(16,24,40,0.1)',
                bgcolor: 'rgba(16,24,40,0.02)',
              }}
            >
              <AccessTime sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={600} fontSize="0.9rem">
                {t('timetable.noPeriodYet')}
              </Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5} fontSize="0.8rem">
                {t('timetable.addPeriodHint')}
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {periods.map((p, i) => {
                const periodNum = i + 1;
                return (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      p: 2, borderRadius: 3,
                      bgcolor: 'rgba(16,24,40,0.02)',
                      border: '1px solid rgba(16,24,40,0.06)',
                      animation: `fadeInUp 200ms ${i * 30}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                      transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: 'rgba(99, 102, 241, 0.04)',
                        borderColor: 'rgba(99, 102, 241, 0.15)',
                      },
                    }}
                  >
                    {/* Period Number Badge */}
                    <Box
                      sx={{
                        minWidth: 36, height: 36, borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: `hsl(${(periodNum * 55) % 360}, 70%, 92%)`,
                        color: `hsl(${(periodNum * 55) % 360}, 70%, 40%)`,
                        fontWeight: 800, fontSize: '0.85rem',
                      }}
                    >
                      {periodNum}
                    </Box>

                    {/* Period Name */}
                    <TextField
                      label={t('timetable.periodName')}
                      value={p.label}
                      onChange={e => updatePeriod(i, 'label', e.target.value)}
                      size="small"
                      placeholder={t('timetable.periodExample')}
                      sx={{
                        minWidth: 160,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                      }}
                    />

                    {/* Time Range */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        label={t('timetable.from')}
                        type="time"
                        value={p.startTime}
                        onChange={e => updatePeriod(i, 'startTime', e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          width: 120,
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                      />
                      <Typography variant="body2" color="text.disabled" fontWeight={600}>—</Typography>
                      <TextField
                        label={t('timetable.to')}
                        type="time"
                        value={p.endTime}
                        onChange={e => updatePeriod(i, 'endTime', e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          width: 120,
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        }}
                      />
                    </Box>

                    <Box flex={1} />

                    {/* Delete Button */}
                    <Tooltip title={t('timetable.deletePeriod')}>
                      <IconButton
                        color="error"
                        onClick={() => removePeriod(i)}
                        size="small"
                        sx={{
                          transition: 'all 150ms',
                          '&:hover': { bgcolor: 'rgba(218, 30, 40, 0.08)', transform: 'scale(1.1)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Period Count */}
        {periods.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 3.5, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {t('timetable.periodsDefined', { count: periods.length })}
              </Typography>
            </Box>
          </>
        )}
      </GlassCard>

      {/* Save Button */}
      <Box
        display="flex"
        justifyContent="flex-end"
        sx={{
          animation: 'fadeInUp 300ms 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: 3, fontWeight: 700, textTransform: 'none',
            px: 5, py: 1.5, fontSize: '1rem',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              boxShadow: '0 6px 28px rgba(99, 102, 241, 0.45)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
            '&:active': { transform: 'scale(0.98)' },
            '&:disabled': { opacity: 0.7 },
            transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {saving ? t('common.saving') : t('timetable.saveSettings')}
        </Button>
      </Box>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {msg && <Alert severity={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      </Snackbar>
    </Box>
  );
}
