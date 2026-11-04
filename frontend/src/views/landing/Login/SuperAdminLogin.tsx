import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import SchoolLogo from '../../../components/common/SchoolLogo';
import GlassSurface from '../../../components/common/GlassSurface';
import LanguageSwitcher from '../../../components/common/LanguageSwitcher';
import { ambientBackground } from '../../../theme/glass';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/superAdmin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" position="relative" overflow="hidden"
      sx={{ background: ambientBackground(theme.palette.mode === 'dark' ? 'dark' : 'light'), backgroundAttachment: 'fixed' }}>
      <Box sx={{ position: 'absolute', top: 16, insetInlineEnd: 16, zIndex: 1 }}>
        <LanguageSwitcher compact />
      </Box>
      <GlassSurface
        strength="strong"
        blur={32}
        sx={{ maxWidth: 440, width: '100%', mx: 2, borderRadius: 5, overflow: 'hidden', animation: 'fadeInUp 450ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <Box sx={{ p: 4.5 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <SchoolLogo variant="root" size={72} animate />
            <Typography variant="h5" fontWeight={700} mt={2.5}>{t('roles.super_admin')}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>{t('auth.superAdminSubtitle')}</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label={t('auth.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} required />
            <TextField fullWidth label={t('auth.password')} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} required
              slotProps={{ input: { endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )} }} />
            <Button fullWidth variant="contained" size="large" type="submit" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </Box>
          <Button fullWidth sx={{ mt: 2 }} onClick={() => navigate('/')}>{t('home.backToHomePage')}</Button>
        </Box>
      </GlassSurface>
    </Box>
  );
}
