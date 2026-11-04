import { Box, Chip, Tooltip, Typography } from '@mui/material';
import AccessTime from '@mui/icons-material/AccessTime';
import GlassSurface from '../common/GlassSurface';
import type { DayOfWeek, TimetableSettings, TimetableSlot } from '../../types';
import { DAY_LABELS } from '../../types';
import { useTranslation } from 'react-i18next';


const PX_PER_MIN = 1.15;
const DAY_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function sortDays(days: DayOfWeek[]): DayOfWeek[] {
  return [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getEndTime(startTime: string, duration: number): string {
  return minutesToHHMM(timeToMinutes(startTime) + duration);
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

function getTodayKey(): DayOfWeek {
  const names: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return names[new Date().getDay()];
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

interface TimetableWeekGridProps {
  settings: TimetableSettings;
  slots: TimetableSlot[];
  onSlotClick?: (slot: TimetableSlot) => void;
  getSubtitle?: (slot: TimetableSlot) => string;
  emptyLabel?: string;
}

export default function TimetableWeekGrid({
  settings,
  slots,
  onSlotClick,
  getSubtitle,
  emptyLabel,
}: TimetableWeekGridProps) {
  const { t } = useTranslation();
  const days = sortDays(settings.studyDays || []);
  const periods = settings.periods || [];

  if (!days.length || !periods.length) {
    return (
      <GlassSurface sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">{t('timetable.noScheduleSet')}</Typography>
      </GlassSurface>
    );
  }

  const gridStart = Math.min(...periods.map(p => timeToMinutes(p.startTime)));
  const gridEnd = Math.max(...periods.map(p => timeToMinutes(p.endTime)));
  const GRID_HEIGHT = Math.round((gridEnd - gridStart) * PX_PER_MIN);
  const hourMarks: number[] = [];
  for (let m = Math.ceil(gridStart / 60) * 60; m < gridEnd; m += 60) hourMarks.push(m);
  const today = getTodayKey();
  const dayCounts: Partial<Record<DayOfWeek, number>> = {};
  days.forEach(d => { dayCounts[d] = slots.filter(s => s.day === d).length; });

  const renderSlotTime = (slot: TimetableSlot) => `${slot.startTime} - ${getEndTime(slot.startTime, slot.duration)}`;

  return (
    <GlassSurface sx={{ p: 0, borderRadius: 3, overflowX: 'auto' }}>
      <Box sx={{ minWidth: 64 + days.length * 150 }}>
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
                    <Typography fontWeight={800} fontSize="0.88rem" noWrap>{t(`timetable.days.${day}`, { defaultValue: DAY_LABELS[day] })}</Typography>
                    {isToday && (
                      <Chip label={t('common.today')} size="small"
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
            return (
              <Box key={day} sx={{
                flex: 1, minWidth: 0, position: 'relative',
                borderLeft: dayIdx < days.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}>
                <Box sx={{ position: 'relative', height: GRID_HEIGHT }}>
                  {hourMarks.map(m => (
                    <Box key={m} sx={{
                      position: 'absolute', top: (m - gridStart) * PX_PER_MIN, left: 0, right: 0,
                      borderTop: '1px dashed', borderColor: 'divider', opacity: 0.55, pointerEvents: 'none',
                    }} />
                  ))}
                  {laidOut.length === 0 && (
                    <Box sx={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', pointerEvents: 'none',
                    }}>
                      <Typography variant="caption" color="text.disabled" fontWeight={700} fontSize="0.66rem">
                        {emptyLabel ?? t('timetable.noSlotsYet')}
                      </Typography>
                    </Box>
                  )}
                  {laidOut.map(({ slot, col, cols }) => {
                    const top = (timeToMinutes(slot.startTime) - gridStart) * PX_PER_MIN;
                    const h = Math.max(slot.duration * PX_PER_MIN - 3, 22);
                    const wPct = 100 / cols;
                    const compact = h < 56;
                    const subtitle = getSubtitle?.(slot);
                    return (
                      <Tooltip key={slot.id} arrow title={
                        <Box>
                          <Typography variant="caption" fontWeight={800} display="block">
                            {slot.type === 'course' ? slot.course?.name || t('timetable.course') : slot.type === 'activity' ? slot.activity?.title || t('timetable.activity') : slot.classroom?.name || t('timetable.classroom')}
                          </Typography>
                          {subtitle && <Typography variant="caption" display="block">{subtitle}</Typography>}
                          <Typography variant="caption" display="block">{renderSlotTime(slot)}</Typography>
                        </Box>
                      }>
                        <Box
                          onClick={onSlotClick ? () => onSlotClick(slot) : undefined}
                          sx={{
                            position: 'absolute', top, height: h, zIndex: 2,
                            left: `calc(${col * wPct}% + 3px)`,
                            width: `calc(${wPct}% - 6px)`,
                            borderRadius: 1.5, p: compact ? 0.5 : 0.75,
                            overflow: 'hidden', color: '#fff',
                            cursor: onSlotClick ? 'pointer' : 'default',
                            background: `linear-gradient(135deg, ${slot.color} 0%, ${shade(slot.color, -32)} 100%)`,
                            boxShadow: `0 2px 10px ${hexToRgba(slot.color, 0.35)}`,
                            transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                              transform: 'translateY(-2px)', zIndex: 5,
                              boxShadow: `0 8px 20px ${hexToRgba(slot.color, 0.45)}`,
                            },
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} noWrap display="block"
                            sx={{ fontSize: compact ? '0.68rem' : '0.75rem' }}>
                            {slot.type === 'course' ? slot.course?.name || t('timetable.course') : slot.type === 'activity' ? slot.activity?.title || t('timetable.activity') : slot.classroom?.name || t('timetable.classroom')}
                          </Typography>
                          {!compact && subtitle && (
                            <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.92, fontSize: '0.64rem', mb: 0.25 }}>
                              {subtitle}
                            </Typography>
                          )}
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 0.75, px: 0.5, py: 0.05 }}>
                            <AccessTime sx={{ fontSize: 9 }} />
                            <Typography variant="caption" dir="ltr" sx={{ fontSize: '0.58rem', fontWeight: 700 }}>
                              {renderSlotTime(slot)}
                            </Typography>
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
}
