import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Chip, Button, TextField, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
} from '@mui/material';
import BackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ResetIcon from '@mui/icons-material/LockReset';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SchoolIcon from '@mui/icons-material/School';
import UsersIcon from '@mui/icons-material/Group';
import MessagesIcon from '@mui/icons-material/Email';
import FeesIcon from '@mui/icons-material/Payments';
import FreezeIcon from '@mui/icons-material/Block';
import UnfreezeIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkIcon from '@mui/icons-material/Link';
import ShieldIcon from '@mui/icons-material/Shield';
import PageHeader from '../../../components/common/PageHeader';
import StatsCard from '../../../components/common/StatsCard';
import DetailCard, { InfoField } from '../../../components/common/DetailCard';
import ProfileHeader from '../../../components/common/ProfileHeader';
import ActionsMenu from '../../../components/common/ActionsMenu';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EditSchoolDialog from './EditSchoolDialog';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import schoolService from '../../../services/schoolService';
import authService from '../../../services/authService';
import type { School } from '../../../types';

const getTypeColors = (t: TFunction): Record<string, { label: string; color: string; bg: string }> => ({
  quranic: { label: t('schoolTypes.quranic'), color: '#d97706', bg: '#fef3c7' },
  private: { label: t('schoolTypes.private'), color: '#4f46e5', bg: '#e0e7ff' },
  kindergarten: { label: t('schoolTypes.kindergarten'), color: '#059669', bg: '#d1fae5' },
});

export default function SchoolDetailPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [clearOpen, setClearOpen] = useState(false);
  const [clearCount, setClearCount] = useState(200);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearSuccess, setClearSuccess] = useState('');
  const [clearError, setClearError] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    schoolService.getBySlug(schoolId)
      .then((res) => setSchool(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => {
    if (!school) return;
    schoolService.getAdmin(school.id)
      .then((res) => { setAdminId(res.data?.id || null); setAdminPhone(res.data?.phone || null); })
      .catch(() => {});
  }, [school]);

  const handleSave = async (data: any) => {
    if (!school) return;
    await schoolService.update(school.id, data);
    const res = await schoolService.getBySlug(school.slug);
    setSchool(res.data);
  };

  const handleResetPassword = async () => {
    if (!adminId || !newPassword) return;
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      await authService.resetPassword(adminId, 'school_admin', newPassword);
      setResetSuccess(t('schools.passwordResetSuccess'));
      setNewPassword('');
    } catch (err: any) {
      setResetError(err?.response?.data?.message || t('schools.failedToReset'));
    } finally { setResetLoading(false); }
  };

  const handleClearMessages = async () => {
    if (!school || clearCount <= 0) return;
    setClearLoading(true);
    setClearError('');
    setClearSuccess('');
    try {
      const res = await schoolService.clearMessages(school.id, clearCount);
      setClearSuccess(t('schools.messagesCleared', { count: res.data.deleted }));
      setSchool({ ...school, currentMessages: res.data.remaining });
      setClearOpen(false);
    } catch (err: any) {
      setClearError(err?.response?.data?.message || t('schools.failedToClearMessages'));
    } finally { setClearLoading(false); }
  };

  const handleDelete = async () => {
    if (!school) return;
    setDeleteLoading(true);
    try {
      await schoolService.delete(school.id);
      navigate('/superAdmin/schools');
    } catch {} finally { setDeleteLoading(false); setDeleteOpen(false); }
  };

  if (loading) {
    return <Box sx={{ textAlign: 'center' }} py={8}><Typography color="text.secondary">{t('common.loading')}</Typography></Box>;
  }
  if (!school) return null;

  const typeMeta = getTypeColors(t)[school.type] || { label: school.type, color: '#64748b', bg: '#f1f5f9' };
  const usersPct = school.maxUsers ? Math.min(Math.round(((school.currentUsers || 0) / school.maxUsers) * 100), 100) : 0;

  return (
    <Box>
      <PageHeader title={school.name} subtitle={t('schools.detailsSubtitle', { slug: school.slug })}
        action={<Button startIcon={<BackIcon />} onClick={() => navigate('/superAdmin/schools')}>{t('schools.backToSchools')}</Button>} />

      {clearSuccess && <Alert severity="success" sx={{ mb: 2 }}>{clearSuccess}</Alert>}

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('students.students')} value={school.studentCount || 0} icon={<SchoolIcon />} color="#6366f1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('schools.maxUsers')} value={school.maxUsers || 0} icon={<UsersIcon />} color="#10b981" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('schools.messages')} value={school.currentMessages || 0} icon={<MessagesIcon />} color="#f59e0b" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('schools.monthlyFee')} value={`${school.monthlyFee || 0} ${t('common.currency')}`} icon={<FeesIcon />} color="#3b82f6" />
        </Grid>
      </Grid>

      <ProfileHeader
        name={school.name}
        avatarText={school.name[0]}
        avatarGradient={school.type === 'quranic' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : school.type === 'private' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #059669)'}
        subtitle={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip label={typeMeta.label} size="small" sx={{ bgcolor: typeMeta.bg, color: typeMeta.color, fontWeight: 700 }} />
            <Chip label={school.isFrozen ? t('schools.frozen') : school.isActive ? t('common.active') : t('common.inactive')} size="small"
              color={school.isFrozen ? 'warning' : 'success'} variant="outlined" />
          </Box>
        }
        action={
          <ActionsMenu items={[
            { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditOpen(true) },
            {
              label: school.isFrozen ? t('schools.unfreeze') : t('schools.freeze'),
              icon: school.isFrozen ? <UnfreezeIcon fontSize="small" /> : <FreezeIcon fontSize="small" />,
              color: school.isFrozen ? '#16a34a' : '#d97706',
              onClick: async () => {
                if (school.isFrozen) { await schoolService.unfreeze(school.id); } else { await schoolService.freeze(school.id); }
                setSchool({ ...school, isFrozen: !school.isFrozen });
              },
            },
            { label: t('schools.clearMessages'), icon: <DeleteSweepIcon fontSize="small" />, onClick: () => { setClearError(''); setClearOpen(true); } },
            { label: t('schools.deleteSchool'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => setDeleteOpen(true) },
          ]} />
        }
      />

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DetailCard title={t('schools.schoolData')} icon={<SchoolIcon />}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('common.phone')} value={<Box display="flex" alignItems="center" gap={0.5}><PhoneIcon fontSize="small" color="action" />{school.phone}</Box>} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('schools.address')} value={school.address || t('common.notAvailable')} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('common.type')} value={<Chip label={typeMeta.label} size="small" sx={{ bgcolor: typeMeta.bg, color: typeMeta.color, fontWeight: 700 }} />} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('common.status')} value={<Chip label={school.isFrozen ? t('schools.frozen') : t('common.active')} size="small" color={school.isFrozen ? 'warning' : 'success'} />} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('schools.monthlyFee')} value={`${school.monthlyFee || 0} ${t('common.currency')}`} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoField
                  label={t('schools.schoolLink')}
                  value={<Box display="flex" alignItems="center" gap={0.5}><LinkIcon fontSize="small" color="action" />{`/s/${school.slug}`}</Box>}
                />
              </Grid>
            </Grid>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <DetailCard title={t('schools.userCapacity')} icon={<UsersIcon />} iconColor="#10b981">
            <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">{t('schools.currentUsage')}</Typography>
              <Typography variant="body2" fontWeight={700}>{school.currentUsers || 0} / {school.maxUsers || 0}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={usersPct}
              sx={{
                height: 10, borderRadius: 5,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { borderRadius: 5, background: 'linear-gradient(90deg, #10b981, #059669)' },
              }}
            />
            <Box mt={3} display="flex" gap={1.5} flexWrap="wrap">
              <Button variant="contained" onClick={() => window.open(`/s/${school.slug}`, '_blank')}>{t('schools.visitSchoolPage')}</Button>
              <Button variant="outlined" color={school.isFrozen ? 'success' : 'warning'} startIcon={school.isFrozen ? <UnfreezeIcon /> : <FreezeIcon />}
                onClick={async () => {
                  if (school.isFrozen) { await schoolService.unfreeze(school.id); } else { await schoolService.freeze(school.id); }
                  setSchool({ ...school, isFrozen: !school.isFrozen });
                }}>
                {school.isFrozen ? t('schools.unfreeze') : t('schools.freeze')}
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => { setClearError(''); setClearOpen(true); }}>
                {t('schools.clearMessages')}
              </Button>
            </Box>
          </DetailCard>
        </Grid>
      </Grid>

      {adminId && (
        <DetailCard title={t('schools.resetAdminPassword')} icon={<ShieldIcon />} iconColor="#d97706" sx={{ mb: 3 }}>
          {resetSuccess && <Alert severity="success" sx={{ mb: 2 }}>{resetSuccess}</Alert>}
          {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
          {adminPhone && (
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="body2" color="text.secondary">{t('schools.adminPhone')}:</Typography>
              <Typography variant="body2" fontWeight={700} dir="ltr">{adminPhone}</Typography>
            </Box>
          )}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('auth.newPassword')} type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder={t('schools.enterNewPassword')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button variant="contained" color="warning" startIcon={<ResetIcon />} onClick={handleResetPassword}
                disabled={resetLoading || !newPassword}>
                {resetLoading ? t('schools.updating') : t('schools.reset')}
              </Button>
            </Grid>
          </Grid>
        </DetailCard>
      )}

      <EditSchoolDialog open={editOpen} school={school} onClose={() => setEditOpen(false)} onSave={handleSave} />

      <ConfirmDialog open={deleteOpen} title={t('schools.deleteSchool')} message={t('schools.deleteConfirm', { name: school.name })}
        confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleteLoading} />

      <Dialog open={clearOpen} onClose={() => setClearOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('schools.clearMessages')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('schools.clearMessagesDesc', { count: school.currentMessages })}
          </Typography>
          {clearError && <Alert severity="error" sx={{ mb: 2 }}>{clearError}</Alert>}
          <TextField
            fullWidth
            type="number"
            label={t('schools.messagesToDelete')}
            value={clearCount}
            onChange={(e) => setClearCount(Math.max(1, Number(e.target.value)))}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClearOpen(false)} disabled={clearLoading}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleClearMessages} disabled={clearLoading || !clearCount || clearCount <= 0}>
            {clearLoading ? t('schools.deleting') : t('schools.confirmClear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
