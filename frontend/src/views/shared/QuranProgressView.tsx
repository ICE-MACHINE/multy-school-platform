import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Select, MenuItem, TextField,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Snackbar, CircularProgress, LinearProgress, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import quranProgressService from '../../services/quranProgressService';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Student, QuranProgress, Surah, QuranStatus, CompletionType, Grade } from '../../types';

const statusLabel = (t: TFunction, s: QuranStatus) => t(`progress.${s === 'not_reached' ? 'notReached' : s}`);
const completionLabel = (t: TFunction, c: CompletionType) => t(`progress.${c}`);
const gradeLabel = (t: TFunction, g: Grade) => t(`progress.${g === 'very_good' ? 'veryGood' : g}`);

const STATUS_COLORS: Record<QuranStatus, 'default' | 'warning' | 'success'> = {
  not_reached: 'default',
  memorizing: 'warning',
  memorized: 'success',
};

const HIZB_OPTIONS = Array.from({ length: 61 }, (_, i) => i);

interface ProgressRow {
  surah: Surah;
  entry: QuranProgress;
}

function emptyEntry(studentId: string, surah: Surah): QuranProgress {
  return {
    id: `_${surah.id}`,
    studentId,
    surahId: surah.id,
    surah,
    status: 'not_reached',
    completionType: null,
    lastAyah: null,
    memorizationType: null,
    grade: null,
    schoolId: '',
    updatedAt: '',
  };
}

interface DraftState {
  status: QuranStatus;
  completionType: '' | CompletionType;
  lastAyah: string;
  grade: '' | Grade;
}

export default function QuranProgressView({ student, readOnly = false }: { student: Student; readOnly?: boolean }) {
  const { t } = useTranslation();
  const FILTERS: { value: 'all' | QuranStatus; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'not_reached', label: t('progress.notReached') },
    { value: 'memorizing', label: t('progress.memorizing') },
    { value: 'memorized', label: t('progress.memorized') },
  ];
  const { schoolId } = useParams<{ schoolId: string }>();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [progress, setProgress] = useState<QuranProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | QuranStatus>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ProgressRow | null>(null);
  const [draft, setDraft] = useState<DraftState>({ status: 'not_reached', completionType: '', lastAyah: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number | null>(student.quranCurrentSurahNumber ?? null);
  const [hizbs, setHizbs] = useState<number>(student.quranHizbs ?? 0);

  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      quranProgressService.getSurahs(schoolId),
      quranProgressService.getByStudent(schoolId, student.id, true),
    ])
      .then(([s, p]) => {
        if (!active) return;
        setSurahs(s.data || []);
        setProgress(p.data || []);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [schoolId, student.id]);

  useEffect(() => {
    setCurrentSurahNumber(student.quranCurrentSurahNumber ?? null);
    setHizbs(student.quranHizbs ?? 0);
  }, [student.quranCurrentSurahNumber, student.quranHizbs]);

  const progressBySurahId = useMemo(() => {
    const map = new Map<number, QuranProgress>();
    progress.forEach((p) => { if (p.surah?.id) map.set(p.surah.id, p); });
    return map;
  }, [progress]);

  const rows = useMemo<ProgressRow[]>(() => {
    const list: ProgressRow[] = surahs
      .map((surah) => ({
        surah,
        entry: progressBySurahId.get(surah.id) || emptyEntry(student.id, surah),
      }))
      .filter(({ surah, entry }) => {
        if (readOnly) {
          const isCurrent = surah.number === currentSurahNumber;
          if (entry.status === 'not_reached' && !isCurrent) return false;
        }
        return true;
      });
    const q = search.trim();
    const filtered = list.filter(({ surah, entry }) => {
      if (filter !== 'all' && entry.status !== filter) return false;
      if (!q) return true;
      return (
        String(surah.number).includes(q)
        || surah.nameArabic.includes(q)
        || surah.nameEnglish.toLowerCase().includes(q.toLowerCase())
      );
    });
    filtered.sort((a, b) => {
      const aCur = a.surah.number === currentSurahNumber;
      const bCur = b.surah.number === currentSurahNumber;
      if (aCur !== bCur) return aCur ? -1 : 1;
      return a.surah.number - b.surah.number;
    });
    return filtered;
  }, [surahs, progressBySurahId, filter, search, currentSurahNumber, student.id, readOnly]);

  const memorizedCount = progress.filter((p) => p.status === 'memorized').length;
  const memorizingCount = progress.filter((p) => p.status === 'memorizing').length;
  const notReachedCount = rows.filter(({ entry }) => entry.status === 'not_reached').length;
  const percentage = surahs.length > 0 ? Math.round((memorizedCount / surahs.length) * 100) : 0;
  const currentSurah = surahs.find((s) => s.number === currentSurahNumber) || null;

  const saveSummary = async (payload: { currentSurahNumber?: number | null; hizbs?: number }) => {
    if (!schoolId) return;
    try {
      await quranProgressService.updateStudentSummary(schoolId, { studentId: student.id, ...payload });
      setMsg(t('progress.summarySaved'));
    } catch {
      setMsg(t('progress.summarySaveFailed'));
    }
  };

  const handleSummaryChange = (field: 'currentSurahNumber' | 'hizbs', value: number | null) => {
    if (field === 'currentSurahNumber') {
      setCurrentSurahNumber(value);
      saveSummary({ currentSurahNumber: value });
    } else {
      const v = value ?? 0;
      setHizbs(v);
      saveSummary({ hizbs: v });
    }
  };

  const openEditor = (row: ProgressRow) => {
    const e = row.entry;
    setEditing(row);
    setDraft({
      status: e.status,
      completionType: e.completionType || '',
      lastAyah: e.lastAyah != null ? String(e.lastAyah) : '',
      grade: e.grade || '',
    });
  };

  const handleStatusChange = (status: QuranStatus) => {
    setDraft((prev) => {
      if (status === 'not_reached') return { status, completionType: '', lastAyah: '', grade: '' };
      if (status === 'memorized') return { status, completionType: 'full', lastAyah: '', grade: prev.grade };
      return { ...prev, status };
    });
  };

  const handleSave = async () => {
    if (!schoolId || !editing) return;
    setSaving(true);
    const isMemorized = draft.status === 'memorized';
    const isMemorizing = draft.status === 'memorizing';
    const payload = {
      studentId: student.id,
      surahId: editing.surah.id,
      status: draft.status,
      completionType: isMemorized ? 'full' : (isMemorizing ? draft.completionType || null : null),
      lastAyah: draft.completionType === 'partial' ? Number(draft.lastAyah) || null : null,
      memorizationType: null,
      grade: isMemorized ? draft.grade || null : null,
    };
    try {
      const res = await quranProgressService.update(schoolId, payload);
      const saved = res.data;
      setProgress((prev) => {
        const idx = prev.findIndex((p) => p.surah?.id === editing.surah.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...payload, id: saved?.id || next[idx].id, updatedAt: saved?.updatedAt || next[idx].updatedAt };
          return next;
        }
        return [...prev, { ...(saved || payload), surah: editing.surah } as QuranProgress];
      });
      setEditing(null);
      setMsg(t('progress.surahUpdated'));
    } catch {
      setMsg(t('progress.surahUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="body2" color="text.secondary" mb={1}>{t('progress.currentSurah')}</Typography>
            {readOnly ? (
              <Typography variant="h6" fontWeight={700}>{currentSurah?.nameArabic || '—'}</Typography>
            ) : (
              <Select
                size="small" fullWidth
                value={currentSurahNumber ?? 0}
                onChange={(e) => handleSummaryChange('currentSurahNumber', e.target.value === 0 ? null : Number(e.target.value))}
                displayEmpty
              >
                <MenuItem value={0} disabled>{t('progress.chooseSurah')}</MenuItem>
                {surahs.map((s) => (
                  <MenuItem key={s.id} value={s.number}>{s.number}. {s.nameArabic}</MenuItem>
                ))}
              </Select>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="body2" color="text.secondary" mb={1}>{t('progress.memorizedHizbs')}</Typography>
            {readOnly ? (
              <Typography variant="h6" fontWeight={700}>{hizbs}<Typography component="span" variant="body2" color="text.secondary"> / 60</Typography></Typography>
            ) : (
              <Select
                size="small" fullWidth
                value={hizbs}
                onChange={(e) => handleSummaryChange('hizbs', Number(e.target.value))}
              >
                {HIZB_OPTIONS.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" fontWeight={800} color="success.main">{memorizedCount}</Typography>
            <Typography variant="body2" color="text.secondary">{t('progress.memorizedSurahs', { count: memorizingCount })}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="body2" color="text.secondary" mb={1}>{t('progress.progressRate')}</Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h4" fontWeight={800} color="primary.main">{percentage}%</Typography>
              <Typography variant="body2" color="text.secondary">{t('progress.surahsTotal', { count: surahs.length })}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4, mt: 1 }} />
          </Paper>
        </Grid>
      </Grid>

      {!readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('progress.clickSurahHint')}
        </Alert>
      )}

      <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mb={2}>
        {FILTERS.filter((f) => !readOnly || f.value !== 'not_reached').map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            onClick={() => setFilter(f.value)}
            color={filter === f.value ? 'primary' : 'default'}
            variant={filter === f.value ? 'filled' : 'outlined'}
            clickable
          />
        ))}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <TextField
            size="small" fullWidth placeholder={t('progress.searchSurah')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            }}
          />
        </Box>
        {!readOnly && notReachedCount > 0 && (
          <Chip label={t('progress.notReachedSurahs', { count: notReachedCount })} size="small" variant="outlined" color="default" />
        )}
      </Box>

      <Grid container spacing={1.5}>
        {rows.map((row) => {
          const { surah, entry } = row;
          const isCurrent = surah.number === currentSurahNumber;
          const isActive = entry.status !== 'not_reached';
          return (
            <Grid key={surah.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Paper
                onClick={() => !readOnly && openEditor(row)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: entry.status === 'not_reached' ? '1px dashed' : '1px solid',
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  bgcolor: entry.status === 'memorized' ? '#10b98110' : entry.status === 'memorizing' ? '#f59e0b10' : 'background.paper',
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: 'box-shadow 110ms cubic-bezier(0.2, 0, 0.38, 0.9)',
                  height: '100%',
                  '&:hover': readOnly ? {} : { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">{surah.number}</Typography>
                    <Typography fontWeight={700} variant="body2">{surah.nameArabic}</Typography>
                  </Box>
                  {isCurrent && <Chip label={t('progress.current')} size="small" color="primary" sx={{ height: 18, fontSize: '0.625rem' }} />}
                </Box>
                <Chip
                  label={statusLabel(t, entry.status)}
                  size="small"
                  color={STATUS_COLORS[entry.status]}
                  sx={{ height: 20, fontSize: '0.6875rem' }}
                />
                {isActive && (
                  <Box mt={0.5}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {entry.completionType === 'partial'
                        ? t('progress.partialUntilAyah', { ayah: entry.lastAyah ?? '' })
                        : entry.completionType === 'full'
                          ? (entry.status === 'memorized'
                            ? t('progress.fullWithGrade', { grade: entry.grade ? gradeLabel(t, entry.grade) : '—' })
                            : t('progress.fullCompletion'))
                          : ''}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {rows.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">{t('progress.noMatchingSurahs')}</Typography>
        </Box>
      )}

      {!readOnly && (
        <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
          <DialogTitle component="div">
            {t('progress.editSurah', { name: editing?.surah.nameArabic })}
            <Typography variant="body2" color="text.secondary">{t('progress.surahNumber', { number: editing?.surah.number })}</Typography>
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Select
                size="small" fullWidth value={draft.status} onChange={(e) => handleStatusChange(e.target.value as QuranStatus)}
              >
                <MenuItem value="not_reached">{t('progress.notReached')}</MenuItem>
                <MenuItem value="memorizing">{t('progress.memorizing')}</MenuItem>
                <MenuItem value="memorized">{t('progress.memorized')}</MenuItem>
              </Select>

              {draft.status === 'memorizing' && (
                <>
                  <Select
                    size="small" fullWidth displayEmpty value={draft.completionType}
                    onChange={(e) => setDraft((p) => ({ ...p, completionType: e.target.value as '' | CompletionType }))}
                  >
                    <MenuItem value="">{t('progress.completionLevel')}</MenuItem>
                    <MenuItem value="full">{completionLabel(t, 'full')}</MenuItem>
                    <MenuItem value="partial">{completionLabel(t, 'partial')}</MenuItem>
                  </Select>
                  {draft.completionType === 'partial' && (
                    <TextField
                      size="small" label={t('progress.lastAyahReached')} type="number"
                      value={draft.lastAyah}
                      onChange={(e) => setDraft((p) => ({ ...p, lastAyah: e.target.value }))}
                    />
                  )}
                </>
              )}

              {draft.status === 'memorized' && (
                <Select
                  size="small" fullWidth displayEmpty value={draft.grade}
                  onChange={(e) => setDraft((p) => ({ ...p, grade: e.target.value as '' | Grade }))}
                >
                  <MenuItem value="">{t('progress.memorizationGrade')}</MenuItem>
                  <MenuItem value="good">{t('progress.good')}</MenuItem>
                  <MenuItem value="very_good">{t('progress.veryGood')}</MenuItem>
                  <MenuItem value="excellent">{t('progress.excellent')}</MenuItem>
                </Select>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || (draft.status === 'memorized' && !draft.grade)}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar open={!!msg} autoHideDuration={2000} onClose={() => setMsg('')} message={msg} />
    </Box>
  );
}
