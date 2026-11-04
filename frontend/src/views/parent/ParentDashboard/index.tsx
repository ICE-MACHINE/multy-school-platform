import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Avatar, Chip } from '@mui/material';
import ChildIcon from '@mui/icons-material/ChildCare';
import ArrowIcon from '@mui/icons-material/ArrowBack';
import PageShell from '../../../components/dashboard/PageShell';
import GlassCard from '../../../components/common/GlassCard';
import parentService from '../../../services/parentService';
import type { Student } from '../../../types';
import { useTranslation } from 'react-i18next';


const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #4589ff, #0f62fe)',
  'linear-gradient(135deg, #42be65, #24a148)',
  'linear-gradient(135deg, #a56eff, #8a3ffc)',
  'linear-gradient(135deg, #ff7eb6, #ee5396)',
];

export default function ParentDashboard() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) parentService.getChildren(schoolId).then((res) => setChildren(res.data || [])).finally(() => setLoading(false));
  }, [schoolId]);

  return (
    <PageShell title={t('titles.myChildren')} subtitle={t('parent.chooseChild')}>
      <Grid container spacing={3}>
        {children.map((child, i) => (
          <Grid key={child.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <GlassCard
              interactive
              onClick={() => navigate(`/s/${schoolId}/parent/${child.id}/progress`)}
              sx={{
                p: 3.5,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                '&:hover .parent-arrow': {
                  transform: 'translateX(-4px)',
                  color: 'primary.main',
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    width: 58,
                    height: 58,
                    fontSize: 22,
                    fontWeight: 700,
                    borderRadius: '18px',
                    flexShrink: 0,
                    background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                    boxShadow: `0 4px 14px ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}`,
                  }}
                >
                  {child.firstName[0]}{child.lastName[0]}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: '1.0625rem' }}>
                    {child.firstName} {child.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.25 }}>
                    {t('parent.registrationNumber', { number: child.registrationNumber })}
                  </Typography>
                </Box>
                <ArrowIcon className="parent-arrow" sx={{ color: 'text.disabled', flexShrink: 0, transition: 'all 200ms ease' }} />
              </Box>
              <Box display="flex" gap={1}>
                {child.classroom && (
                  <Chip
                    label={child.classroom.name}
                    size="small"
                    sx={{
                      height: 26,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: 'rgba(15, 98, 254, 0.1)',
                      color: 'primary.main',
                    }}
                  />
                )}
                <Chip
                  label={t('parent.viewDetails')}
                  size="small"
                  variant="outlined"
                  sx={{ height: 26, fontSize: '0.75rem' }}
                />
              </Box>
            </GlassCard>
          </Grid>
        ))}
        {children.length === 0 && !loading && (
          <Grid size={{ xs: 12 }}>
            <GlassCard
              interactive={false}
              sx={{
                py: 9,
                textAlign: 'center',
                borderStyle: 'dashed',
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(15, 98, 254, 0.1)',
                }}
              >
                <ChildIcon sx={{ fontSize: 34, color: 'primary.main', opacity: 0.7 }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, fontWeight: 500 }}>
                {t('parent.noChildrenYet')}
              </Typography>
            </GlassCard>
          </Grid>
        )}
      </Grid>
    </PageShell>
  );
}
