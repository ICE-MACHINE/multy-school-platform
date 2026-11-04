import { Box, Container, Typography, Button, Paper, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShieldIcon from '@mui/icons-material/Shield';
import BoltIcon from '@mui/icons-material/Bolt';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { easings, durations } from '../../../../theme/motion';
import SchoolLogo from '../../../../components/common/SchoolLogo';
import { useTranslation } from 'react-i18next';
import TrustBadges from '../../../../components/landing/hero/TrustBadges';

const heroChild = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: durations.slow / 1000, ease: easings.spring },
});

export default function RootHero() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const SCHOOL_TYPES = [
    { type: t('home.schoolTypeQuranic'), variant: 'quranic' as const, color: '#f59e0b', desc: t('home.schoolTypeQuranicDesc') },
    { type: t('home.schoolTypePrivate'), variant: 'private' as const, color: '#6366f1', desc: t('home.schoolTypePrivateDesc') },
    { type: t('home.schoolTypeKindergarten'), variant: 'kindergarten' as const, color: '#10b981', desc: t('home.schoolTypeKindergartenDesc') },
  ];

  return (
    <Box
      sx={{
        pt: { xs: 13, md: 16 },
        pb: { xs: 13, md: 15 },
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #c084fc 80%, #f0abfc 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 10s ease infinite',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
      }}
    >
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: -90, right: -70, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%)', filter: 'blur(18px)' }}
      />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ position: 'absolute', bottom: 40, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(14px)' }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={5}>
          <Box maxWidth={620}>
            <motion.div {...heroChild(0)} style={{ display: 'inline-block' }}>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: 15 }} />}
                label={t('home.modernSchoolManagement')}
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 700,
                  '& .MuiChip-icon': { color: '#fde68a' },
                }}
              />
            </motion.div>
            <motion.div {...heroChild(0.1)}>
              <Typography variant="h2" fontWeight={800} mb={2} sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.15 }}>
                {t('home.heroTitle')}
              </Typography>
            </motion.div>
            <motion.div {...heroChild(0.2)}>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400, lineHeight: 1.7 }}>
                {t('home.heroSubtitle')}
              </Typography>
            </motion.div>
            <motion.div {...heroChild(0.3)}>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    variant="contained" size="large" onClick={() => navigate('/superAdmin/login')}
                    sx={{
                      bgcolor: 'white', color: '#6d28d9', px: 4, py: 1.5,
                      borderRadius: 2, fontWeight: 700, fontSize: '1rem',
                      boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                    }}
                    endIcon={<ArrowIcon />}
                  >
                    {t('landing.startNow')}
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
            <motion.div {...heroChild(0.4)}>
              <TrustBadges
                isDark
                iconColor="#fde68a"
                sx={{ mt: 4 }}
                items={[
                  { icon: <ShieldIcon sx={{ fontSize: 16 }} />, label: t('landing.secureData') },
                  { icon: <BoltIcon sx={{ fontSize: 16 }} />, label: t('home.outstandingPerformance') },
                ]}
              />
            </motion.div>
          </Box>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: durations.slow / 1000, ease: easings.spring }}
            style={{ flexShrink: 0 }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 360 },
                p: 2,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              }}
            >
              <Box display="flex" flexDirection="column" gap={1.5}>
                {SCHOOL_TYPES.map((item, i) => (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12, duration: durations.normal / 1000, ease: easings.spring }}
                    whileHover={{ x: -4, transition: { duration: 0.1 } }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        transition: 'background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                      }}
                    >
                      <SchoolLogo variant={item.variant} size={40} animate={false} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ color: 'white', fontSize: '0.9375rem' }}>
                          {item.type}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ opacity: 0.8, color: 'white' }}>
                          {item.desc}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: `${item.color}40`,
                          color: 'white',
                          '& .MuiSvgIcon-root': { fontSize: 16 },
                        }}
                      >
                        <ArrowIcon />
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Container>

      <Box sx={{ position: 'absolute', bottom: -1, left: 0, right: 0, lineHeight: 0, zIndex: 0, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width: '100%', height: 54, display: 'block' }}>
          <path d="M0,40 C240,76 480,10 720,26 C960,42 1200,80 1440,42 L1440,70 L0,70 Z" fill={theme.palette.background.default} />
        </svg>
      </Box>
    </Box>
  );
}
