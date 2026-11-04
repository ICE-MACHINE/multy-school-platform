import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button, Alert, Chip, IconButton, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/LockReset';
import InfoIcon from '@mui/icons-material/Info';
import PhoneIcon from '@mui/icons-material/Phone';
import MailIcon from '@mui/icons-material/Email';
import PageHeader from '../../../components/common/PageHeader';
import DetailCard, { InfoField } from '../../../components/common/DetailCard';
import ProfileHeader from '../../../components/common/ProfileHeader';
import { pillFieldSx } from '../../../components/common/filterStyles';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import authService from '../../../services/authService';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: (user as any).email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (form.newPassword) {
        if (!form.currentPassword) {
          setError(t('profile.enterCurrentPassword'));
          setLoading(false);
          return;
        }
        if (form.newPassword !== form.confirmPassword) {
          setError(t('profile.passwordsMismatch'));
          setLoading(false);
          return;
        }
        await authService.updateProfile({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      } else {
        await authService.updateProfile({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        });
      }
      if (updateUser) {
        await updateUser({ firstName: form.firstName, lastName: form.lastName, phone: form.phone } as any);
      }
      setSuccess(t('profile.updatedSuccessfully'));
      setEditing(false);
      setForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('common.failedToUpdate'));
    } finally { setLoading(false); }
  };


  const roleColors: Record<string, string> = {
    super_admin: '#6366f1',
    school_admin: '#f59e0b',
    teacher: '#3b82f6',
    parent: '#10b981',
  };

  const role = user?.role || 'teacher';
  const roleColor = roleColors[role];

  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    setForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  return (
    <Box>
      <PageHeader title={t('titles.profile')} subtitle={t('profile.subtitle')} />
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <ProfileHeader
        name={`${user?.firstName} ${user?.lastName}`}
        avatarText={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
        avatarGradient={`linear-gradient(135deg, ${roleColor}, ${role === 'super_admin' ? '#a855f7' : role === 'school_admin' ? '#d97706' : role === 'teacher' ? '#2563eb' : '#059669'})`}
        subtitle={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip label={t(`roles.${role}`, { defaultValue: role })} size="small" sx={{ bgcolor: `${roleColor}18`, color: roleColor, fontWeight: 700 }} />
            <Chip label={user?.isActive !== false ? t('common.active') : t('common.inactive')} size="small" color={user?.isActive !== false ? 'success' : 'error'} variant="outlined" />
          </Box>
        }
        action={
          !editing && (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)} sx={{ borderRadius: 2 }}>
              {t('common.edit')}
            </Button>
          )
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DetailCard title={t('profile.personalData')} icon={<PersonIcon />}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label={t('students.firstName')} value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={!editing}
                  sx={pillFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label={t('students.lastName')} value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={!editing}
                  sx={pillFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label={t('common.phone')} value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!editing}
                  sx={pillFieldSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label={t('profile.email')} value={form.email}
                  disabled
                  sx={pillFieldSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><MailIcon fontSize="small" color="action" /></InputAdornment> } }}
                />
              </Grid>
            </Grid>
          </DetailCard>

          {editing && (
            <DetailCard title={t('profile.changePassword')} icon={<LockIcon />} iconColor="#d97706" sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {t('profile.leavePasswordBlank')}
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label={t('profile.currentPassword')} type={showPassword ? 'text' : 'password'} value={form.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                    sx={pillFieldSx}
                    slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label={t('auth.newPassword')} type={showPassword ? 'text' : 'password'} value={form.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)} sx={pillFieldSx} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label={t('profile.confirmNewPassword')} type={showPassword ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)} sx={pillFieldSx} />
                </Grid>
              </Grid>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                <Button onClick={cancelEdit}>{t('common.cancel')}</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading} sx={{ borderRadius: 2 }}>
                  {loading ? t('common.saving') : t('profile.saveChanges')}
                </Button>
              </Box>
            </DetailCard>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <DetailCard title={t('profile.accountInfo')} icon={<InfoIcon />} iconColor="#10b981">
            <Box display="flex" flexDirection="column" gap={2.5}>
              <InfoField label={t('profile.role')} value={<Chip label={t(`roles.${role}`, { defaultValue: role })} size="small" sx={{ bgcolor: `${roleColor}18`, color: roleColor, fontWeight: 700 }} />} />
              <InfoField label={t('profile.school')} value={schoolId || t('profile.platform')} />
              <InfoField label={t('profile.accountStatus')} value={<Chip label={user?.isActive !== false ? t('common.active') : t('common.inactive')} size="small" color={user?.isActive !== false ? 'success' : 'error'} />} />
            </Box>
          </DetailCard>
        </Grid>
      </Grid>
    </Box>
  );
}
