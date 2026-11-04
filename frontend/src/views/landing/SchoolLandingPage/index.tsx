import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import schoolService from '../../../services/schoolService';
import { useTheme } from '../../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from '../../../components/landing/landingTheme';
import type { School } from '../../../types';
import { schoolTypeConfigs } from '../../../components/landing/landingTypes';
import LandingNavbar from '../../../components/landing/LandingNavbar';
import LandingHero from '../../../components/landing/LandingHero';
import LandingStatsBar from '../../../components/landing/LandingStatsBar';
import LandingFeatures from '../../../components/landing/LandingFeatures';
import LandingHighlights from '../../../components/landing/LandingHighlights';
import LandingTestimonials from '../../../components/landing/LandingTestimonials';
import LandingCTA from '../../../components/landing/LandingCTA';
import LandingFooter from '../../../components/landing/LandingFooter';

export default function SchoolLandingPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const { t } = useTranslation();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    schoolService.getPublicSchool(schoolId)
      .then((res) => setSchool(res.data))
      .catch(() => setError(t('schoolLanding.notFound.title')))
      .finally(() => setLoading(false));
  }, [schoolId, t]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#eef2ff' }}>
        <CircularProgress size={48} sx={{ color: '#f59e0b' }} />
      </Box>
    );
  }

  if (error || !school) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column" gap={3}
        sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#eef2ff', color: mode === 'dark' ? 'white' : '#1e1b4b' }}>
        <Typography variant="h3" fontWeight={800}>{t('schoolLanding.notFound.title')}</Typography>
        <Typography variant="body1" sx={{ opacity: 0.7 }}>{t('schoolLanding.notFound.subtitle')}</Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/')}
          sx={{ bgcolor: '#f59e0b', px: 4, py: 1.5, borderRadius: 3, fontWeight: 600 }}>
          {t('home.backToHomePage')}
        </Button>
      </Box>
    );
  }

  const config = schoolTypeConfigs[school.type] || schoolTypeConfigs.private;
  const colors = getLandingColors((config.id as LandingVariant) || 'private', mode);

  const sharedProps = {
    config,
    schoolName: school.name,
    schoolPhone: school.phone,
    schoolAddress: school.address,
    schoolId,
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.pageBg, color: colors.textPrimary, overflow: 'hidden' }}>
      <LandingNavbar {...sharedProps} />

      {/* Each school type has a UNIQUE section order */}
      {school.type === 'quranic' && (
        <>
          <LandingHero {...sharedProps} />
          <LandingFeatures {...sharedProps} />
          <LandingHighlights {...sharedProps} />
          <LandingStatsBar {...sharedProps} />
          <LandingTestimonials {...sharedProps} />
          <LandingCTA {...sharedProps} />
        </>
      )}

      {school.type === 'private' && (
        <>
          <LandingHero {...sharedProps} />
          <LandingStatsBar {...sharedProps} />
          <LandingFeatures {...sharedProps} />
          <LandingHighlights {...sharedProps} />
          <LandingTestimonials {...sharedProps} />
          <LandingCTA {...sharedProps} />
        </>
      )}

      {school.type === 'kindergarten' && (
        <>
          <LandingHero {...sharedProps} />
          <LandingFeatures {...sharedProps} />
          <LandingStatsBar {...sharedProps} />
          <LandingHighlights {...sharedProps} />
          <LandingTestimonials {...sharedProps} />
          <LandingCTA {...sharedProps} />
        </>
      )}

      <LandingFooter {...sharedProps} />
    </Box>
  );
}
