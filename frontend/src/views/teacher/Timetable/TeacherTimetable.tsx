import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Chip, Alert, Snackbar, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select,
  MenuItem, Divider,
} from '@mui/material';
import SwapIcon from '@mui/icons-material/SwapHoriz';
import AnyTimeIcon from '@mui/icons-material/Schedule';
import PageHeader from '../../../components/common/PageHeader';
import GlassSurface from '../../../components/common/GlassSurface';
import TimetableWeekGrid from '../../../components/timetable/TimetableWeekGrid';
import timetableService from '../../../services/timetableService';
import type { TimetableSlot, TimetableSettings, DayOfWeek, ScheduleChangeRequest } from '../../../types';
import { DAY_LABELS } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';


function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getEndTime(startTime: string, duration: number): string {
  const total = timeToMinutes(startTime) + duration;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function TeacherTimetable() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { user } = useAuth();
  const [settings, setSettings] = useState<TimetableSettings | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState(false);
  const [requestSlot, setRequestSlot] = useState<TimetableSlot | null>(null);
  const [requestMode, setRequestMode] = useState<'specific' | 'any'>('specific');
  const [requestForm, setRequestForm] = useState<{
    requestedDay?: DayOfWeek;
    requestedPeriodId?: string;
    reason: string;
  }>({ reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAll = useCallback(async () => {
    if (!schoolId || !user?.id) return;
    setLoading(true);
    try {
      const [settingsRes, slotsRes, requestsRes] = await Promise.all([
        timetableService.getSettings(schoolId),
        timetableService.getMySlots(schoolId),
        timetableService.getChangeRequests(schoolId),
      ]);
      setSettings(settingsRes.data);
      setSlots(slotsRes.data || []);
      setRequests((requestsRes.data || []).filter(r => r.teacherId === user.id && r.status === 'pending'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [schoolId, user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openRequest = (slot: TimetableSlot) => {
    setRequestSlot(slot);
    setRequestForm({ reason: '' });
    setRequestMode('specific');
    setRequestDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!schoolId || !requestSlot) return;
    setSubmitting(true);
    try {
      const payload: {
        slotId: string;
        requestedDay?: DayOfWeek;
        requestedPeriodId?: string;
        reason?: string;
      } = {
        slotId: requestSlot.id,
        reason: requestForm.reason || undefined,
      };
      if (requestMode === 'specific') {
        payload.requestedDay = requestForm.requestedDay;
        payload.requestedPeriodId = requestForm.requestedPeriodId;
      }
      await timetableService.createChangeRequest(schoolId, payload);
      setMsg({ type: 'success', text: t('timetable.requestSent') });
      setRequestDialog(false);
      fetchAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || t('timetable.sendFailed') });
    } finally { setSubmitting(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const periods = settings?.periods || [];
  const allDays = settings?.studyDays || [];

  const getSlotLabel = (slot: TimetableSlot) => {
    if (slot.type === 'course') return slot.course?.name || t('timetable.course');
    if (slot.type === 'activity') return slot.activity?.title || t('timetable.activity');
    return slot.classroom?.name || t('timetable.classroom');
  };

  const renderSlotTime = (slot: TimetableSlot) => {
    const end = getEndTime(slot.startTime, slot.duration);
    return `${slot.startTime} - ${end}`;
  };

  return (
    <Box>
      <PageHeader title={t('timetable.mySchedule')} subtitle={t('timetable.myScheduleSubtitle')} />

      {!settings || periods.length === 0 ? (
        <GlassSurface sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">{t('timetable.noScheduleSet')}</Typography>
        </GlassSurface>
      ) : (
        <TimetableWeekGrid settings={settings} slots={slots} onSlotClick={openRequest} emptyLabel={t('timetable.noLessonsToday')} />
      )}

      {requests.length > 0 && (
        <GlassSurface sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>{t('timetable.pendingRequests')}</Typography>
          {requests.map(r => (
            <Box key={r.id} sx={{ p: 1.5, mb: 1, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {r.slot?.type === 'course' && r.slot?.course?.name}
                    {r.slot?.type === 'activity' && r.slot?.activity?.title}
                    {r.slot?.type === 'classroom' && r.slot?.classroom?.name}
                  </Typography>
                  {r.requestedDay && (
                    <Typography variant="caption" color="text.secondary">
                      {t('timetable.toLabel', { day: t(`timetable.days.${r.requestedDay}`, { defaultValue: DAY_LABELS[r.requestedDay] }) })}
                      {r.requestedPeriodId && t('timetable.periodSuffix', { period: periods.find(p => p.id === r.requestedPeriodId)?.label || '' })}
                    </Typography>
                  )}
                  {!r.requestedDay && !r.requestedPeriodId && (
                    <Typography variant="caption" color="text.secondary">{t('timetable.anyOtherTime')}</Typography>
                  )}
                  {r.reason && (
                    <Typography variant="caption" display="block" color="text.secondary">{t('timetable.reasonLabel', { reason: r.reason })}</Typography>
                  )}
                </Box>
                <Chip label={t('timetable.pending')} size="small" color="warning" />
              </Box>
            </Box>
          ))}
        </GlassSurface>
      )}

      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('timetable.requestChange')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {requestSlot && (
              <Alert severity="info" icon={<SwapIcon />}>
                <Typography fontWeight={600}>
                  {t('timetable.currentSession', { day: t(`timetable.days.${requestSlot.day}`, { defaultValue: DAY_LABELS[requestSlot.day] }), label: getSlotLabel(requestSlot), time: renderSlotTime(requestSlot) })}
                </Typography>
              </Alert>
            )}

            <Divider />

            <Box display="flex" gap={1}>
              <Button
                variant={requestMode === 'specific' ? 'contained' : 'outlined'}
                onClick={() => setRequestMode('specific')}
                startIcon={<SwapIcon />}
                sx={{ flex: 1 }}
              >
                {t('timetable.specificTime')}
              </Button>
              <Button
                variant={requestMode === 'any' ? 'contained' : 'outlined'}
                onClick={() => setRequestMode('any')}
                startIcon={<AnyTimeIcon />}
                sx={{ flex: 1 }}
                color="secondary"
              >
                {t('timetable.anyOtherTime')}
              </Button>
            </Box>

            {requestMode === 'specific' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>{t('timetable.newDayOptional')}</InputLabel>
                  <Select value={requestForm.requestedDay || ''} label={t('timetable.newDayOptional')}
                    onChange={e => setRequestForm(f => ({ ...f, requestedDay: e.target.value as DayOfWeek || undefined }))}>
                    <MenuItem value="">{t('timetable.noChange')}</MenuItem>
                    {allDays.map(day => (
                      <MenuItem key={day} value={day}>{t(`timetable.days.${day}`, { defaultValue: DAY_LABELS[day] })}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>{t('timetable.newPeriodOptional')}</InputLabel>
                  <Select value={requestForm.requestedPeriodId || ''} label={t('timetable.newPeriodOptional')}
                    onChange={e => setRequestForm(f => ({ ...f, requestedPeriodId: e.target.value || undefined }))}>
                    <MenuItem value="">{t('timetable.noChange')}</MenuItem>
                    {periods.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.label} ({p.startTime} - {p.endTime})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {requestMode === 'any' && (
              <Alert severity="info" icon={<AnyTimeIcon />}>
                {t('timetable.anyTimeHint')}
              </Alert>
            )}

            <TextField label={t('timetable.changeReasonOptional')} multiline rows={2} fullWidth
              value={requestForm.reason}
              onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmitRequest} disabled={submitting}
            startIcon={<SwapIcon />}>
            {submitting ? t('timetable.sendingRequest') : t('timetable.sendRequest')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {msg && <Alert severity={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      </Snackbar>
    </Box>
  );
}
