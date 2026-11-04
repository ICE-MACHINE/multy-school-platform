import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Alert, Snackbar, CircularProgress, Paper } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CompleteIcon from '@mui/icons-material/TaskAlt';
import DoneIcon from '@mui/icons-material/CheckCircle';
import PlannedIcon from '@mui/icons-material/Schedule';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SegmentedControl from '../../../components/common/SegmentedControl';
import activityService from '../../../services/activityService';
import type { Activity, ActivityCategory, ActivityPeriod, ActivityStatus, CreateActivityPayload, StudentActivityParticipation } from '../../../types';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const CATEGORY_VALUES: ActivityCategory[] = ['physical', 'creative', 'cognitive', 'social', 'moral', 'linguistic'];
const periodLabel = (t: TFunction, p: ActivityPeriod) => t(`activities.${p}`);

function todayStr(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function autoPeriod(): ActivityPeriod {
  return new Date().getHours() < 12 ? 'morning' : 'afternoon';
}

const emptyForm: CreateActivityPayload = {
  title: '',
  description: '',
  category: 'cognitive',
  date: todayStr(),
  period: autoPeriod(),
  startTime: '',
  endTime: '',
  location: '',
  materials: '',
};

export default function ActivitiesPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<CreateActivityPayload>(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const [participationTarget, setParticipationTarget] = useState<Activity | null>(null);
  const [participations, setParticipations] = useState<StudentActivityParticipation[]>([]);
  const [participationLoading, setParticipationLoading] = useState(false);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await activityService.getAll(schoolId, { limit: 100 });
      setActivities(res.data || []);
    } catch { setMsg({ type: 'error', text: t('activities.loadFailed') }); } finally { setLoading(false); }
  }, [schoolId, t]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: todayStr(), period: autoPeriod() });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      title: activity.title,
      description: activity.description || '',
      category: activity.category,
      date: activity.date,
      period: activity.period,
      startTime: activity.startTime || '',
      endTime: activity.endTime || '',
      location: activity.location || '',
      materials: activity.materials || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const submit = async (payload: CreateActivityPayload) => {
    if (!schoolId || !payload.title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await activityService.update(schoolId, editing.id, payload);
        setMsg({ type: 'success', text: t('activities.updated') });
      } else {
        await activityService.create(schoolId, payload);
        setMsg({ type: 'success', text: payload.completeToday ? t('activities.createdCompletedToday') : t('activities.createdAsPlan') });
      }
      setDialogOpen(false);
      fetch();
    } catch (err: any) { setError(err?.response?.data?.message || t('activities.saveFailed')); }
    finally { setSubmitting(false); }
  };

  const handleSavePlan = () => submit({ ...form, status: 'planned', completeToday: false });
  const handleCompleteTodayOnCreate = () => submit({ ...form, status: 'completed', completeToday: true, date: todayStr(), period: autoPeriod() });

  const handleCompleteToday = async (activity: Activity) => {
    if (!schoolId || completing) return;
    setCompleting(activity.id);
    try {
      const res = await activityService.complete(schoolId, activity.id);
      setMsg({
        type: 'success',
        text: res.data.alreadyCompleted
          ? t('activities.alreadyCompleted')
          : t('activities.completedToday', { period: periodLabel(t, res.data.activity.period) }),
      });
      fetch();
    } catch (err: any) { setMsg({ type: 'error', text: err?.response?.data?.message || t('activities.completeFailed') }); }
    finally { setCompleting(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !schoolId) return;
    try {
      await activityService.delete(schoolId, deleteTarget.id);
      setMsg({ type: 'success', text: t('activities.deleted') });
      setDeleteTarget(null);
      fetch();
    } catch { setMsg({ type: 'error', text: t('activities.deleteFailed') }); }
  };

  const openParticipation = async (activity: Activity) => {
    setParticipationTarget(activity);
    if (!schoolId) return;
    setParticipationLoading(true);
    try {
      const res = await activityService.getParticipations(schoolId, activity.id);
      setParticipations(res.data || []);
    } catch { setParticipations([]); }
    finally { setParticipationLoading(false); }
  };

  const statusChip = (status: ActivityStatus) =>
    status === 'completed' ? (
      <Chip size="small" icon={<DoneIcon />} label={t('activities.done')} color="success" />
    ) : (
      <Chip size="small" icon={<PlannedIcon />} label={t('activities.notDoneYet')} color="default" variant="outlined" />
    );

  return (
    <Box>
      <PageHeader title={t('titles.activities')} subtitle={t('activities.subtitle')} actionLabel={t('activities.addActivity')} onAction={openCreate} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : activities.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'action.hover' }}>
          <Typography color="text.secondary">{t('activities.noActivitiesYet')}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {activities.map((a) => (
            <Grid key={a.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.06)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms cubic-bezier(0.16,1,0.3,1)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 40px rgba(0,0,0,0.1)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box>
                    <Typography fontWeight={700} fontSize="0.95rem">{a.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.date} · {periodLabel(t, a.period)}
                      {a.classroom?.name ? ` · ${a.classroom.name}` : ''}
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
                    <IconButton size="small" color="primary" onClick={() => openParticipation(a)}><GroupIcon fontSize="small" /></IconButton>
                    {a.status === 'planned' && (
                      <IconButton size="small" onClick={() => openEdit(a)}><EditIcon fontSize="small" /></IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  {statusChip(a.status)}
                  <Chip label={t(`activities.${a.category}`, { defaultValue: a.category })} size="small" variant="outlined" />
                  {a.startTime && <Chip label={`${a.startTime} - ${a.endTime || ''}`} size="small" variant="outlined" />}
                </Box>

                {a.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{a.description}</Typography>
                )}

                <Box mt="auto">
                  {a.status === 'planned' ? (
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      startIcon={<CompleteIcon />}
                      disabled={completing === a.id}
                      onClick={() => handleCompleteToday(a)}
                    >
                      {completing === a.id ? t('activities.completing') : t('activities.completeTodayButton')}
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t('activities.participated', { done: a.participations?.filter((p) => p.participated).length || 0, total: a.participations?.length || 0 })}
                      {a.participations?.some((p) => !p.participated) ? t('activities.someAbsent') : ''}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('activities.editActivity') : t('activities.addActivity')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label={t('activities.activityName')} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <TextField label={t('activities.activityType')} select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ActivityCategory }))}>
              {CATEGORY_VALUES.map((c) => <MenuItem key={c} value={c}>{t(`activities.${c}`)}</MenuItem>)}
            </TextField>
            <TextField label={t('activities.activityDescription')} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} multiline rows={2} />
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="date" label={t('activities.activityDate')} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{t('activities.period')}</Typography>
                  <SegmentedControl
                    value={form.period}
                    onChange={(v) => setForm((p) => ({ ...p, period: v as ActivityPeriod }))}
                    options={[
                      { value: 'morning' as ActivityPeriod, label: t('activities.morning') },
                      { value: 'afternoon' as ActivityPeriod, label: t('activities.afternoon') },
                    ]}
                  />
                </Box>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField type="time" label={t('activities.startTime')} value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField type="time" label={t('activities.endTime')} value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            </Grid>
            <TextField label={t('activities.location')} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            <TextField label={t('activities.materials')} value={form.materials} onChange={(e) => setForm((p) => ({ ...p, materials: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          {!editing && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CompleteIcon />}
              disabled={submitting || !form.title.trim()}
              onClick={handleCompleteTodayOnCreate}
            >
              {t('activities.completeTodayShort')}
            </Button>
          )}
          <Button variant="contained" onClick={handleSavePlan} disabled={submitting || !form.title.trim()}>
            {submitting ? t('common.saving') : editing ? t('common.save') : t('activities.saveAsPlan')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!participationTarget} onClose={() => setParticipationTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('activities.participationTitle', { title: participationTarget?.title })}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            {t('activities.participationNote', { period: periodLabel(t, participationTarget?.period || 'morning'), date: participationTarget?.date })}
          </Typography>
          {participationLoading ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
          ) : participations.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              {participationTarget?.status === 'planned' ? t('activities.noOneRegistered') : t('activities.noStudentsRegistered')}
            </Typography>
          ) : (
            participations.map((p) => (
              <Box key={p.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
                <Typography>{p.student?.firstName} {p.student?.lastName}</Typography>
                <Chip
                  label={p.participated ? t('attendance.present') : t('activities.missedIt')}
                  size="small"
                  color={p.participated ? 'success' : 'error'}
                />
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParticipationTarget(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title={t('activities.deleteTitle')} message={t('activities.deleteMessage', { title: deleteTarget?.title })} confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <Snackbar open={!!msg} autoHideDuration={2500} onClose={() => setMsg(null)}><Alert severity={msg?.type} onClose={() => setMsg(null)}>{msg?.text}</Alert></Snackbar>
    </Box>
  );
}
