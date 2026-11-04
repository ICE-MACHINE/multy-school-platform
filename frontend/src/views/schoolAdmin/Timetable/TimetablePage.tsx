import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, Snackbar, CircularProgress, Chip, IconButton, Fab, Tooltip,
  Avatar, ToggleButton, ToggleButtonGroup, Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import DragIndicator from '@mui/icons-material/DragIndicator';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import AccessTime from '@mui/icons-material/AccessTime';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Groups from '@mui/icons-material/Groups';
import Schedule from '@mui/icons-material/Schedule';
import PendingActions from '@mui/icons-material/PendingActions';
import CalendarViewDay from '@mui/icons-material/CalendarViewDay';
import CalendarViewWeek from '@mui/icons-material/CalendarViewWeek';
import PageHeader from '../../../components/common/PageHeader';
import GlassSurface from '../../../components/common/GlassSurface';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import timetableService from '../../../services/timetableService';
import aiService from '../../../services/aiService';
import { formatRatioPercent, getErrorMessage } from '../../../components/ai/aiUtils';
import teacherManagementService from '../../../services/teacherManagementService';
import type { TimetableSlot, TimetableSettings, DayOfWeek, Teacher, ScheduleChangeRequest } from '../../../types';
import { DAY_LABELS } from '../../../types';

interface SlotForm {
  teacherId: string;
  day: DayOfWeek;
  startTime: string;
  duration: number;
}

const emptyForm: SlotForm = {
  teacherId: '', day: 'saturday', startTime: '08:00', duration: 60,
};

const getRequestStatus = (t: TFunction): Record<string, { label: string; color: 'warning' | 'success' | 'error' }> => ({
  pending: { label: t('timetable.statusPending'), color: 'warning' },
  approved: { label: t('timetable.statusApproved'), color: 'success' },
  rejected: { label: t('timetable.statusRejected'), color: 'error' },
});
const getAiDecisionMeta = (t: TFunction): Record<string, { label: string; color: 'success' | 'error' | 'warning' }> => ({
  approve: { label: t('ai.approve'), color: 'success' },
  reject: { label: t('ai.reject'), color: 'error' },
  manual_review: { label: t('ai.manualReview'), color: 'warning' },
});
const DAY_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function sortDays(days: DayOfWeek[]): DayOfWeek[] {
  return [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
}
const AVATAR_PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7'];
const PX_PER_MIN = 1.15;
const SNAP_MIN = 15;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatDuration(t: TFunction, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t('timetable.durationMinutes', { count: m });
  if (m === 0) return h === 1 ? t('timetable.durationOneHour') : h === 2 ? t('timetable.durationTwoHours') : t('timetable.durationHours', { count: h });
  if (h === 1 && m === 30) return t('timetable.durationHourHalf');
  if (h === 1) return t('timetable.durationHourMinutes', { count: m });
  return t('timetable.durationHoursMinutes', { hours: h, minutes: m });
}

function getEndTime(startTime: string, duration: number): string {
  const total = timeToMinutes(startTime) + duration;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function layoutDaySlots(daySlots: TimetableSlot[]): { slot: TimetableSlot; col: number; cols: number }[] {
  const sorted = [...daySlots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const clusters: TimetableSlot[][] = [];
  let cluster: TimetableSlot[] = [];
  let clusterEnd = -1;
  sorted.forEach(s => {
    const st = timeToMinutes(s.startTime);
    if (cluster.length && st >= clusterEnd) {
      clusters.push(cluster);
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(s);
    clusterEnd = Math.max(clusterEnd, st + s.duration);
  });
  if (cluster.length) clusters.push(cluster);

  const out: { slot: TimetableSlot; col: number; cols: number }[] = [];
  clusters.forEach(c => {
    const colEnds: number[] = [];
    const placed: { slot: TimetableSlot; col: number }[] = [];
    c.forEach(s => {
      const st = timeToMinutes(s.startTime);
      let col = colEnds.findIndex(end => end <= st);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(0);
      }
      colEnds[col] = st + s.duration;
      placed.push({ slot: s, col });
    });
    placed.forEach(p => out.push({ ...p, cols: colEnds.length }));
  });
  return out;
}

function shade(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  return `rgba(${num >> 16}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${alpha})`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map(p => p[0]).join('');
}

function colorFromString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getTodayKey(): DayOfWeek {
  const names: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return names[new Date().getDay()];
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <GlassSurface sx={{
      flex: 1, minWidth: 150, p: 1.75, borderRadius: 3,
      display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{
        width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${hexToRgba(color, 0.18)}, ${hexToRgba(color, 0.06)})`,
        color, border: `1px solid ${hexToRgba(color, 0.2)}`,
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={800} fontSize="1.2rem" lineHeight={1.2}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block">
          {label}
        </Typography>
      </Box>
    </GlassSurface>
  );
}

export default function TimetablePage() {
  const { t } = useTranslation();
  const REQUEST_STATUS = getRequestStatus(t);
  const dayLabel = (d: DayOfWeek) => t(`timetable.days.${d}`, { defaultValue: DAY_LABELS[d] });
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TimetableSettings | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ScheduleChangeRequest[]>([]);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SlotForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [viewMode, setViewMode] = useState<'day' | 'full'>('day');
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [ghost, setGhost] = useState<{ day: DayOfWeek; top: number; height: number } | null>(null);
  const dragSlotRef = useRef<TimetableSlot | null>(null);
  const lastGhostRef = useRef<string>('');

  const fetchAll = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [settingsRes, slotsRes, teachersRes, requestsRes] = await Promise.all([
        timetableService.getSettings(schoolId),
        timetableService.getSlots(schoolId),
        teacherManagementService.getAll(schoolId, { limit: 200 }),
        timetableService.getChangeRequests(schoolId),
      ]);
      setSettings({ ...settingsRes.data, studyDays: sortDays(settingsRes.data.studyDays || []) });
      setSlots(slotsRes.data || []);
      setTeachers(teachersRes.data || []);
      setAllRequests(requestsRes.data || []);
      setChangeRequests((requestsRes.data || []).filter(r => r.status === 'pending'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sweepRef = useRef(false);
  useEffect(() => {
    if (!requestsOpen || !schoolId || sweepRef.current) return;
    sweepRef.current = true;
    void (async () => {
      try {
        const swept = await aiService.evaluatePendingScheduleRequests(schoolId).catch(() => null);
        if (swept?.data && swept.data.evaluated > 0) {
          const requestsRes = await timetableService.getChangeRequests(schoolId);
          setAllRequests(requestsRes.data || []);
          setChangeRequests((requestsRes.data || []).filter(r => r.status === 'pending'));
        }
      } finally {
        sweepRef.current = false;
      }
    })();
  }, [requestsOpen, schoolId]);

  const getSlotAt = (day: DayOfWeek, periodId: string) =>
    slots.find(s => s.day === day && s.periodId === periodId);

  const openCreate = (day: DayOfWeek, periodId: string, periodStartTime?: string) => {
    const period = settings?.periods.find(p => p.id === periodId);
    setForm({
      ...emptyForm,
      day,
      startTime: period?.startTime || periodStartTime || '08:00',
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (slot: TimetableSlot) => {
    setForm({
      teacherId: slot.teacherId,
      day: slot.day,
      startTime: slot.startTime,
      duration: slot.duration,
    });
    setEditingId(slot.id);
    setDialogOpen(true);
  };

  const getSlotLabel = (slot: TimetableSlot) => {
    if (slot.type === 'course') return slot.course?.name || t('timetable.courseFallback');
    if (slot.type === 'activity') return slot.activity?.title || t('timetable.activityFallback');
    return slot.classroom?.name || t('timetable.classroomFallback');
  };

  const getTeacherName = (teacherId: string) => {
    const t = teachers.find(x => x.id === teacherId);
    return t ? `${t.firstName} ${t.lastName}` : '';
  };

  const activeTeachers = teachers.filter(t => t.isActive !== false);

  const stats = useMemo(() => ({
    total: slots.length,
    teachers: new Set(slots.map(s => s.teacherId)).size,
    hours: slots.reduce((acc, s) => acc + s.duration, 0) / 60,
    requests: changeRequests.length,
  }), [slots, changeRequests]);

  const dayCounts = useMemo(() => {
    const counts = {} as Record<DayOfWeek, number>;
    (settings?.studyDays || []).forEach(d => { counts[d] = 0; });
    slots.forEach(s => { if (s.day in counts) counts[s.day] += 1; });
    return counts;
  }, [slots, settings]);

  const timeValidation = useMemo(() => {
    if (!settings || !form.startTime || !form.duration) return null;
    const period = settings.periods.find(p => {
      const s = timeToMinutes(form.startTime);
      return s >= timeToMinutes(p.startTime) && s < timeToMinutes(p.endTime);
    });
    if (!period) return { valid: false, message: t('timetable.startOutsidePeriod') };
    const endMin = timeToMinutes(form.startTime) + form.duration;
    const periodEnd = timeToMinutes(period.endTime);
    if (endMin > periodEnd) {
      return { valid: false, message: t('timetable.sessionExceedsPeriod', { label: period.label, from: period.startTime, to: period.endTime }) };
    }
    return { valid: true, period, endTime: getEndTime(form.startTime, form.duration) };
  }, [settings, form.startTime, form.duration]);

  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const refreshRequests = useCallback(async () => {
    if (!schoolId) return;
    const requestsRes = await timetableService.getChangeRequests(schoolId);
    setAllRequests(requestsRes.data || []);
    setChangeRequests((requestsRes.data || []).filter(r => r.status === 'pending'));
  }, [schoolId]);

  const handleEvaluateRequest = async (request: ScheduleChangeRequest) => {
    if (!schoolId || evaluatingId) return;
    setEvaluatingId(request.id);
    try {
      const res = await aiService.evaluateScheduleRequest(schoolId, request.id);
      if (res.data?.autoProcessed) {
        setMsg({ type: 'success', text: t('ai.autoProcessed') });
        await fetchAll();
      } else {
        await refreshRequests();
      }
    } catch (err) {
      setMsg({ type: 'error', text: getErrorMessage(err, t('ai.loadFailed')) });
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!schoolId) return;
    try {
      await timetableService.handleRequest(schoolId, requestId, { status });
      setMsg({ type: 'success', text: status === 'approved' ? t('timetable.requestApproved') : t('timetable.requestRejected') });
      fetchAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || t('timetable.couldNotProcess') });
    }
  };

  const handleSaveSlot = async () => {
    if (!schoolId || !form.teacherId) {
      setMsg({ type: 'error', text: t('timetable.chooseTeacher') });
      return;
    }
    if (!timeValidation?.valid) {
      setMsg({ type: 'error', text: timeValidation?.message || t('timetable.checkTime') });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await timetableService.updateSlot(schoolId, editingId, {
          teacherId: form.teacherId,
          day: form.day,
          startTime: form.startTime,
          duration: form.duration,
        });
        setMsg({ type: 'success', text: t('timetable.sessionUpdated') });
      } else {
        await timetableService.createSlot(schoolId, {
          teacherId: form.teacherId,
          day: form.day,
          startTime: form.startTime,
          duration: form.duration,
        });
        setMsg({ type: 'success', text: t('timetable.sessionAdded') });
      }
      setDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || t('timetable.couldNotSave') });
    } finally { setSaving(false); }
  };

  const handleDeleteSlot = async () => {
    if (!deleteTarget || !schoolId) return;
    try {
      await timetableService.deleteSlot(schoolId, deleteTarget.id);
      setMsg({ type: 'success', text: t('timetable.sessionDeleted') });
      fetchAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || t('timetable.couldNotDelete') });
    } finally { setDeleteTarget(null); }
  };

  const handleDragStart = (e: React.DragEvent, slot: TimetableSlot) => {
    dragSlotRef.current = slot;
    setDragActive(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.id);
    (e.target as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    dragSlotRef.current = null;
    lastGhostRef.current = '';
    setDragActive(false);
    setDragOverCell(null);
    setGhost(null);
  };

  const renderSlotTime = (slot: TimetableSlot) => {
    const end = getEndTime(slot.startTime, slot.duration);
    return `${slot.startTime} - ${end}`;
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  if (!settings || settings.periods.length === 0) {
    return (
      <Box>
        <PageHeader title={t('timetable.title')} subtitle={t('timetable.subtitle')} />
        <GlassSurface sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" mb={2}>{t('timetable.notConfigured')}</Typography>
          <Button variant="contained" startIcon={<SettingsIcon />}
            onClick={() => navigate(`/s/${schoolId}/admin/timetable/settings`)}>
            {t('timetable.settings')}
          </Button>
        </GlassSurface>
      </Box>
    );
  }

  const periods = settings.periods;
  const today = getTodayKey();
  const hoursLabel = Number.isInteger(stats.hours) ? `${stats.hours}` : stats.hours.toFixed(1);

  const renderFullGrid = (days: DayOfWeek[]) => {
    const gridStart = Math.min(...periods.map(p => timeToMinutes(p.startTime)));
    const gridEnd = Math.max(...periods.map(p => timeToMinutes(p.endTime)));
    const GRID_HEIGHT = Math.round((gridEnd - gridStart) * PX_PER_MIN);
    const hourMarks: number[] = [];
    for (let m = Math.ceil(gridStart / 60) * 60; m < gridEnd; m += 60) hourMarks.push(m);
    const tableMinWidth = 64 + days.length * (days.length === 1 ? 420 : 150);

    const minutesFromY = (clientY: number, el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const raw = gridStart + (clientY - rect.top) / PX_PER_MIN;
      return Math.max(gridStart, Math.min(gridEnd - SNAP_MIN, Math.round(raw / SNAP_MIN) * SNAP_MIN));
    };

    const handleColumnDragOver = (e: React.DragEvent, day: DayOfWeek) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const mins = minutesFromY(e.clientY, e.currentTarget as HTMLElement);
      const key = `${day}:${mins}`;
      if (lastGhostRef.current === key) return;
      lastGhostRef.current = key;
      setDragOverCell(prev => (prev === `col:${day}` ? prev : `col:${day}`));
      setGhost({
        day,
        top: (mins - gridStart) * PX_PER_MIN,
        height: (dragSlotRef.current?.duration || 60) * PX_PER_MIN,
      });
    };

    const handleColumnDragLeave = (e: React.DragEvent, day: DayOfWeek) => {
      if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
      lastGhostRef.current = '';
      setDragOverCell(prev => (prev === `col:${day}` ? null : prev));
      setGhost(g => (g?.day === day ? null : g));
    };

    const handleColumnDrop = async (e: React.DragEvent, day: DayOfWeek) => {
      e.preventDefault();
      lastGhostRef.current = '';
      setDragOverCell(null);
      setGhost(null);
      const slot = dragSlotRef.current;
      if (!slot || !schoolId) return;
      const mins = minutesFromY(e.clientY, e.currentTarget as HTMLElement);
      const period = periods.find(p => mins >= timeToMinutes(p.startTime) && mins < timeToMinutes(p.endTime));
      if (!period) {
        setMsg({ type: 'error', text: t('timetable.outsidePeriods') });
        return;
      }
      if (slot.day === day && slot.periodId === period.id) return;
      try {
        await timetableService.moveSlot(schoolId, slot.id, { day, periodId: period.id, startTime: minutesToHHMM(mins) });
        setMsg({ type: 'success', text: t('timetable.sessionMoved') });
        fetchAll();
      } catch (err: any) {
        setMsg({ type: 'error', text: err?.response?.data?.message || t('timetable.couldNotMove') });
      }
    };

    const handleColumnClick = (e: React.MouseEvent, day: DayOfWeek) => {
      if (dragSlotRef.current) return;
      const mins = minutesFromY(e.clientY, e.currentTarget as HTMLElement);
      openCreate(day, '', minutesToHHMM(mins));
    };

    return (
      <GlassSurface sx={{ p: 0, borderRadius: 3, overflowX: 'auto' }}>
        <Box sx={{ minWidth: tableMinWidth }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ width: 64, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 1.25 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="0.62rem">
                {t('timetable.time')}
              </Typography>
            </Box>
            {days.map(day => {
              const isToday = day === today;
              return (
                <Box key={day} sx={{ flex: 1, minWidth: 0, p: 1 }}>
                  <Box sx={{
                    borderRadius: 2, py: 1, px: 1.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                    background: isToday
                      ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                      : hexToRgba('#6366f1', 0.07),
                    color: isToday ? '#fff' : 'text.primary',
                    border: isToday ? 'none' : '1px solid',
                    borderColor: 'divider',
                    boxShadow: isToday ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography fontWeight={800} fontSize="0.88rem" noWrap>{dayLabel(day)}</Typography>
                      {isToday && (
                        <Chip label={t('timetable.today')} size="small"
                          sx={{ height: 18, fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, flexShrink: 0 }} />
                      )}
                    </Box>
                    <Box sx={{
                      minWidth: 22, height: 22, borderRadius: '50%', px: 0.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 800,
                      bgcolor: isToday ? 'rgba(255,255,255,0.25)' : hexToRgba('#6366f1', 0.15),
                      color: isToday ? '#fff' : 'primary.main',
                    }}>
                      {dayCounts[day] || 0}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ width: 64, flexShrink: 0, position: 'relative' }}>
              {hourMarks.map(m => (
                <Box key={m} sx={{ position: 'absolute', top: (m - gridStart) * PX_PER_MIN - 7, left: 0, right: 0, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontSize="0.62rem" fontWeight={700} dir="ltr">
                    {minutesToHHMM(m)}
                  </Typography>
                </Box>
              ))}
            </Box>
            {days.map((day, dayIdx) => {
              const laidOut = layoutDaySlots(slots.filter(s => s.day === day));
              const isColOver = dragOverCell === `col:${day}`;
              return (
                <Box key={day} sx={{
                  flex: 1, minWidth: 0, position: 'relative',
                  borderLeft: dayIdx < days.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  bgcolor: isColOver ? hexToRgba('#6366f1', 0.05) : 'transparent',
                  transition: 'background 150ms',
                }}>
                  <Box
                    sx={{ position: 'relative', height: GRID_HEIGHT }}
                    onDragOver={e => handleColumnDragOver(e, day)}
                    onDragLeave={e => handleColumnDragLeave(e, day)}
                    onDrop={e => handleColumnDrop(e, day)}
                    onClick={e => handleColumnClick(e, day)}
                  >
                    {hourMarks.map(m => (
                      <Box key={m} sx={{
                        position: 'absolute', top: (m - gridStart) * PX_PER_MIN, left: 0, right: 0,
                        borderTop: '1px dashed', borderColor: 'divider', opacity: 0.55, pointerEvents: 'none',
                      }} />
                    ))}
                    {dragActive && !isColOver && (
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} fontSize="0.62rem">
                          {t('timetable.dropHere')}
                        </Typography>
                      </Box>
                    )}
                    {ghost?.day === day && (
                      <Box sx={{
                        position: 'absolute', top: ghost.top, left: 5, right: 5, height: ghost.height,
                        borderRadius: 1.5, border: '2px dashed', borderColor: 'primary.main',
                        bgcolor: hexToRgba('#6366f1', 0.14), pointerEvents: 'none', zIndex: 4,
                      }} />
                    )}
                    {laidOut.map(({ slot, col, cols }) => {
                      const top = (timeToMinutes(slot.startTime) - gridStart) * PX_PER_MIN;
                      const h = Math.max(slot.duration * PX_PER_MIN - 3, 22);
                      const wPct = 100 / cols;
                      const compact = h < 56;
                      return (
                        <Tooltip key={slot.id} arrow title={
                          <Box>
                            <Typography variant="caption" fontWeight={800} display="block">{getSlotLabel(slot)}</Typography>
                            <Typography variant="caption" display="block">{getTeacherName(slot.teacherId)}</Typography>
                            <Typography variant="caption" display="block">{renderSlotTime(slot)} · {formatDuration(t, slot.duration)}</Typography>
                          </Box>
                        }>
                          <Box
                            draggable
                            onDragStart={e => handleDragStart(e, slot)}
                            onDragEnd={handleDragEnd}
                            onClick={e => { e.stopPropagation(); openEdit(slot); }}
                            sx={{
                              position: 'absolute', top, height: h, zIndex: 2,
                              left: `calc(${col * wPct}% + 3px)`,
                              width: `calc(${wPct}% - 6px)`,
                              borderRadius: 1.5, p: compact ? 0.5 : 0.75,
                              cursor: 'grab', overflow: 'hidden', color: '#fff',
                              background: `linear-gradient(135deg, ${slot.color} 0%, ${shade(slot.color, -32)} 100%)`,
                              boxShadow: `0 2px 10px ${hexToRgba(slot.color, 0.35)}`,
                              transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                              '&:hover': {
                                transform: 'translateY(-2px)', zIndex: 5,
                                boxShadow: `0 8px 20px ${hexToRgba(slot.color, 0.45)}`,
                                '& .slot-actions': { opacity: 1 },
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: compact ? 0 : 0.25 }}>
                              <Avatar sx={{
                                width: 18, height: 18, fontSize: '0.52rem', fontWeight: 800,
                                bgcolor: 'rgba(255,255,255,0.28)', color: '#fff', flexShrink: 0,
                              }}>
                                {getInitials(getTeacherName(slot.teacherId))}
                              </Avatar>
                              <Typography variant="caption" fontWeight={800} noWrap sx={{ flex: 1, fontSize: compact ? '0.68rem' : '0.75rem' }}>
                                {getSlotLabel(slot)}
                              </Typography>
                              {!compact && <DragIndicator sx={{ fontSize: 12, opacity: 0.5, flexShrink: 0 }} />}
                            </Box>
                            {!compact && (
                              <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.92, fontSize: '0.64rem', mb: 0.25 }}>
                                {getTeacherName(slot.teacherId)}
                              </Typography>
                            )}
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 0.75, px: 0.5, py: 0.05 }}>
                              <AccessTime sx={{ fontSize: 9 }} />
                              <Typography variant="caption" dir="ltr" sx={{ fontSize: '0.58rem', fontWeight: 700 }}>
                                {renderSlotTime(slot)}
                              </Typography>
                            </Box>
                            <Box className="slot-actions" sx={{ position: 'absolute', top: 2, left: 2, opacity: 0, transition: 'opacity 0.2s' }}>
                              <IconButton size="small" color="inherit"
                                onClick={e => { e.stopPropagation(); setDeleteTarget(slot); }}
                                sx={{ bgcolor: 'rgba(0,0,0,0.25)', '&:hover': { bgcolor: 'rgba(0,0,0,0.45)' } }}>
                                <DeleteIcon sx={{ fontSize: 11 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </GlassSurface>
    );
  };

    return (
    <Box>
      <PageHeader
        title={t('timetable.title')}
        subtitle={t('timetable.manageSubtitle')}
        actionLabel={t('timetable.settingsShort')}
        actionIcon={<SettingsIcon />}
        onAction={() => navigate(`/s/${schoolId}/admin/timetable/settings`)}
      />

      <Box display="flex" gap={1.5} mb={2.5} flexWrap="wrap">
        <StatCard icon={<CalendarMonth />} value={stats.total} label={t('timetable.totalSessions')} color="#6366f1" />
        <StatCard icon={<Groups />} value={stats.teachers} label={t('timetable.teachersInSchedule')} color="#8b5cf6" />
        <StatCard icon={<Schedule />} value={`${hoursLabel} ${t('timetable.hoursSuffix')}`} label={t('timetable.weeklyHours')} color="#06b6d4" />
        <StatCard icon={<PendingActions />} value={stats.requests} label={t('timetable.pendingRequests')} color={stats.requests > 0 ? '#f97316' : '#22c55e'} />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1.5}>
        {viewMode === 'day' ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={selectedDay}
            onChange={(_e, v: DayOfWeek | null) => v && setSelectedDay(v)}
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {settings.studyDays.map(day => (
              <ToggleButton key={day} value={day}
                sx={{
                  borderRadius: '20px !important', px: 1.75, py: 0.4,
                  fontWeight: 700, fontSize: '0.8rem',
                  border: '1px solid', borderColor: 'divider !important',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: '#fff',
                    boxShadow: '0 3px 10px rgba(99, 102, 241, 0.35)',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)' },
                  },
                }}>
                {dayLabel(day)}
                {dayCounts[day] > 0 && (
                  <Box component="span" sx={{
                    mr: 0.75, minWidth: 18, height: 18, px: 0.5, borderRadius: '9px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.62rem', fontWeight: 800,
                    bgcolor: selectedDay === day ? 'rgba(255,255,255,0.25)' : hexToRgba('#6366f1', 0.12),
                    color: selectedDay === day ? '#fff' : 'primary.main',
                  }}>
                    {dayCounts[day]}
                  </Box>
                )}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : <Box />}

        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={(_e, v: 'day' | 'full' | null) => v && setViewMode(v)}
          >
            <ToggleButton value="day"
              sx={{ borderRadius: '10px 0 0 10px !important', px: 1.5, fontWeight: 700, fontSize: '0.78rem' }}>
              <CalendarViewDay sx={{ fontSize: 17, ml: 0.5 }} /> {t('timetable.day')}
            </ToggleButton>
            <ToggleButton value="full"
              sx={{ borderRadius: '0 10px 10px 0 !important', px: 1.5, fontWeight: 700, fontSize: '0.78rem' }}>
              <CalendarViewWeek sx={{ fontSize: 17, ml: 0.5 }} /> {t('timetable.fullWeek')}
            </ToggleButton>
          </ToggleButtonGroup>
          <Badge badgeContent={stats.requests} color="warning" overlap="circular">
            <Button variant="outlined" startIcon={<PendingActions />}
              onClick={() => setRequestsOpen(true)}
              sx={{
                fontWeight: 700, borderRadius: 2, fontSize: '0.8rem',
                borderColor: stats.requests > 0 ? 'rgba(249, 115, 22, 0.5)' : 'divider',
                color: stats.requests > 0 ? '#f97316' : 'text.primary',
                bgcolor: stats.requests > 0 ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                '&:hover': {
                  borderColor: '#f97316', bgcolor: 'rgba(249, 115, 22, 0.12)',
                },
              }}>
              {t('timetable.changeRequests')}
            </Button>
          </Badge>
        </Box>
      </Box>

      {viewMode === 'full' ? renderFullGrid(settings.studyDays) : renderFullGrid([selectedDay])}

      <Dialog open={requestsOpen} onClose={() => setRequestsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PendingActions sx={{ color: '#f97316' }} />
          {t('timetable.changeRequestsTitle')}
          {stats.requests > 0 && (
            <Chip label={t('timetable.pendingChip', { count: stats.requests })} size="small" color="warning" sx={{ fontWeight: 800 }} />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {allRequests.length === 0 ? (
            <Box py={5} textAlign="center">
              <PendingActions sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={600}>{t('timetable.noChangeRequests')}</Typography>
            </Box>
          ) : (
            [...allRequests]
              .sort((a, b) => {
                if ((a.status === 'pending') !== (b.status === 'pending')) return a.status === 'pending' ? -1 : 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map(r => {
                const status = REQUEST_STATUS[r.status] || REQUEST_STATUS.pending;
                return (
                  <Box key={r.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                    p: 2, mb: 1, borderRadius: 2,
                    bgcolor: r.status === 'pending' ? 'rgba(249, 115, 22, 0.04)' : 'action.hover',
                    border: r.status === 'pending'
                      ? '1px solid rgba(249, 115, 22, 0.15)'
                      : '1px solid',
                    borderColor: 'divider',
                    opacity: r.status === 'pending' ? 1 : 0.75,
                    '&:last-child': { mb: 0 },
                  }}>
                    <Avatar sx={{
                      width: 34, height: 34, fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                      background: `linear-gradient(135deg, #f97316, #ea580c)`,
                    }}>
                      {getInitials(`${r.teacher?.firstName || ''} ${r.teacher?.lastName || ''}`)}
                    </Avatar>
                    <Box flex={1} sx={{ minWidth: 220 }}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography fontWeight={700} fontSize="0.9rem">
                          {r.teacher?.firstName} {r.teacher?.lastName}
                        </Typography>
                        <Chip label={status.label} size="small" color={status.color}
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                        {r.aiDecision ? (
                          <Chip
                            label={`${t('ai.engineDecision')}: ${getAiDecisionMeta(t)[r.aiDecision]?.label || r.aiDecision}`}
                            size="small"
                            variant="filled"
                            color={getAiDecisionMeta(t)[r.aiDecision]?.color || 'default'}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        ) : (
                          <Chip label={t('ai.notAnalyzed')} size="small" variant="outlined"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                        )}
                        {typeof r.constraintFeasible === 'boolean' && (
                          <Chip
                            label={r.constraintFeasible ? t('ai.feasible') : t('ai.infeasible')}
                            size="small"
                            variant="outlined"
                            color={r.constraintFeasible ? 'success' : 'error'}
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        )}
                        {r.aiConfidence != null && (
                          <Chip
                            label={`${t('ai.moveFeasibility')}: ${formatRatioPercent(r.aiConfidence)}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        {r.slot?.type === 'course' && r.slot?.course?.name}
                        {r.slot?.type === 'activity' && r.slot?.activity?.title}
                        {r.slot?.type === 'classroom' && r.slot?.classroom?.name}
                        {' — '}
                        {r.slot?.day ? dayLabel(r.slot.day as DayOfWeek) : r.slot?.day}
                        {r.slot?.startTime && ` (${r.slot.startTime})`}
                      </Typography>
                      {(r.requestedDay || r.requestedPeriodId) && (
                        <Typography variant="caption" color="primary" fontWeight={700} display="block">
                          {t('timetable.wantMoveTo', { day: r.requestedDay ? dayLabel(r.requestedDay) : '' })}
                          {r.requestedPeriodId && ` — ${settings?.periods?.find(p => p.id === r.requestedPeriodId)?.label || ''}`}
                        </Typography>
                      )}
                      {!r.requestedDay && !r.requestedPeriodId && (
                        <Typography variant="caption" color={r.status === 'pending' ? 'warning.main' : 'text.secondary'} fontWeight={700} display="block">
                          {t('timetable.wantAnyTime')}
                        </Typography>
                      )}
                      {r.reason && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {t('timetable.reasonLabel', { reason: r.reason })}
                        </Typography>
                      )}
                      {r.adminNote && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {t('timetable.adminNote', { note: r.adminNote })}
                        </Typography>
                      )}
                      {r.aiDecision ? (
                        <Box sx={{ mt: 1.25, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" fontWeight={800} display="block" mb={0.5}>
                            {`${t('ai.constraintEngine')} — ${t('ai.engineDecision')}: ${getAiDecisionMeta(t)[r.aiDecision]?.label || r.aiDecision}`}
                            {r.aiConfidence != null ? ` · ${t('ai.moveFeasibility')}: ${formatRatioPercent(r.aiConfidence)}` : ''}
                          </Typography>
                          {r.aiReason && (
                            <Typography variant="caption" display="block" color="text.secondary">{r.aiReason}</Typography>
                          )}
                          {!!r.constraintViolations?.length && (
                            <Box mt={0.75}>
                              <Typography variant="caption" fontWeight={700} display="block">{t('ai.violations')}</Typography>
                              {r.constraintViolations.map(v => (
                                <Typography key={v.code} variant="caption" display="block" color="error">
                                  {t(`ai.constraints.${v.code}`, { defaultValue: v.message || v.code })}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          {!!r.suggestedAlternatives?.length && (
                            <Box mt={0.75}>
                              <Typography variant="caption" fontWeight={700} display="block">{t('ai.suggestedAlternatives')}</Typography>
                              {r.suggestedAlternatives.slice(0, 3).map(a => (
                                <Typography key={`${a.day}-${a.periodId}`} variant="caption" display="block" color="text.secondary">
                                  {`${dayLabel(a.day as DayOfWeek)} ${a.periodLabel ? `${a.periodLabel} ` : ''}${a.startTime} · ${t('ai.score')}: ${a.score}`}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          <Box mt={0.75}>
                            <Typography variant="caption" fontWeight={700} display="block">{t('ai.agentAdvisory')}</Typography>
                            {r.agentRecommendation ? (
                              <>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={getAiDecisionMeta(t)[r.agentRecommendation]?.color || 'default'}
                                  label={getAiDecisionMeta(t)[r.agentRecommendation]?.label || r.agentRecommendation}
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                />
                                {r.agentSummary && (
                                  <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>{r.agentSummary}</Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="caption" display="block" color="text.secondary">{t('ai.noAgentAdvisory')}</Typography>
                            )}
                          </Box>
                          {r.autoProcessed && (
                            <Typography variant="caption" display="block" color="success.main" fontWeight={700} mt={0.75}>
                              {t('ai.autoProcessed')}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        r.status === 'pending' && (
                          <Typography variant="caption" display="block" color="warning.main" fontWeight={700} mt={0.75}>
                            {t('ai.notAnalyzed')}
                          </Typography>
                        )
                      )}
                    </Box>
                    {r.status === 'pending' && (
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button size="small" variant="outlined" disabled={evaluatingId === r.id}
                          onClick={() => handleEvaluateRequest(r)}>
                          {evaluatingId === r.id ? t('ai.evaluating') : t('ai.evaluate')}
                        </Button>
                        <Button size="small" variant="contained" color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleRequestAction(r.id, 'approved')}>
                          {t('timetable.approve')}
                        </Button>
                        <Button size="small" variant="outlined" color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleRequestAction(r.id, 'rejected')}>
                          {t('timetable.reject')}
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequestsOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? t('timetable.editSession') : t('timetable.addSession')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {form.teacherId && timeValidation?.valid && (
              <Box sx={{
                borderRadius: 2, p: 1.25, color: '#fff',
                background: `linear-gradient(135deg, ${colorFromString(form.teacherId)}, ${shade(colorFromString(form.teacherId), -32)})`,
                boxShadow: `0 4px 14px ${hexToRgba(colorFromString(form.teacherId), 0.35)}`,
                display: 'flex', alignItems: 'center', gap: 1.25,
              }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'rgba(255,255,255,0.28)' }}>
                  {getInitials(getTeacherName(form.teacherId))}
                </Avatar>
                <Box flex={1} sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800} fontSize="0.88rem" noWrap>
                    {getTeacherName(form.teacherId)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {dayLabel(form.day)} · {form.startTime} - {timeValidation.endTime} · {formatDuration(t, form.duration)}
                  </Typography>
                </Box>
                <AccessTime sx={{ opacity: 0.7 }} />
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>{t('timetable.teacher')}</InputLabel>
              <Select value={form.teacherId} label={t('timetable.teacher')}
                onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                {activeTeachers.length === 0 && (
                  <MenuItem disabled>{t('timetable.noActiveTeachers')}</MenuItem>
                )}
                {activeTeachers.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}{t.classroom?.name ? ` — ${t.classroom.name}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2} flexWrap="wrap">
              <FormControl fullWidth sx={{ flex: 1, minWidth: 140 }}>
                <InputLabel>{t('timetable.dayLabel')}</InputLabel>
                <Select value={form.day} label={t('timetable.dayLabel')}
                  onChange={e => setForm(f => ({ ...f, day: e.target.value as DayOfWeek }))}>
                  {settings.studyDays.map(day => (
                    <MenuItem key={day} value={day}>{dayLabel(day)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={t('timetable.startTime')}
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                sx={{ flex: 1, minWidth: 140 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>{t('timetable.duration')}</InputLabel>
              <Select value={form.duration} label={t('timetable.duration')}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                <MenuItem value={30}>{t('timetable.duration30')}</MenuItem>
                <MenuItem value={45}>{t('timetable.duration45')}</MenuItem>
                <MenuItem value={60}>{t('timetable.duration60')}</MenuItem>
                <MenuItem value={75}>{t('timetable.duration75')}</MenuItem>
                <MenuItem value={90}>{t('timetable.duration90')}</MenuItem>
                <MenuItem value={100}>{t('timetable.duration100')}</MenuItem>
                <MenuItem value={120}>{t('timetable.duration120')}</MenuItem>
                <MenuItem value={150}>{t('timetable.duration150')}</MenuItem>
                <MenuItem value={180}>{t('timetable.duration180')}</MenuItem>
              </Select>
            </FormControl>

            {timeValidation && !timeValidation.valid && (
              <Alert severity="error">{timeValidation.message}</Alert>
            )}
            {timeValidation?.valid && timeValidation.period && (
              <Alert severity="success" icon={<AccessTime />}>
                {t('timetable.periodInfo', { label: timeValidation.period.label, from: form.startTime, to: timeValidation.endTime, duration: formatDuration(t, form.duration) })}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveSlot} disabled={saving || !timeValidation?.valid}
            sx={{ borderRadius: 2, px: 3 }}>
            {saving ? t('common.saving') : editingId ? t('timetable.update') : t('timetable.add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('timetable.deleteSession')}</DialogTitle>
        <DialogContent>
          <Typography>{t('timetable.deleteSessionConfirm')}</Typography>
          {deleteTarget && (
            <Box mt={1.5} sx={{
              p: 1.25, borderRadius: 2,
              background: hexToRgba(deleteTarget.color, 0.08),
              border: `1px solid ${hexToRgba(deleteTarget.color, 0.25)}`,
            }}>
              <Typography variant="body2" fontWeight={700}>
                {getSlotLabel(deleteTarget)} — {getTeacherName(deleteTarget.teacherId)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayLabel(deleteTarget.day)} · {renderSlotTime(deleteTarget)} · {formatDuration(t, deleteTarget.duration)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteSlot}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>

      <Tooltip title={t('timetable.addSession')}>
        <Fab color="primary" onClick={() => {
          const firstEmpty = periods.find(p => !getSlotAt(selectedDay, p.id));
          openCreate(selectedDay, firstEmpty?.id || periods[0]?.id || '');
        }}
          sx={{
            position: 'fixed', bottom: 32, left: 32, zIndex: 1200,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)', boxShadow: '0 6px 28px rgba(99, 102, 241, 0.55)' },
          }}>
          <AddIcon />
        </Fab>
      </Tooltip>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {msg && <Alert severity={msg.type} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      </Snackbar>
    </Box>
  );
}
