import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import RocketIcon from '@mui/icons-material/RocketLaunch';
import { motion } from 'framer-motion';
import { Reveal, glassSx, AmbientBlobs } from '../../../../components/landing/landingGlass';
import { useTranslation } from 'react-i18next';
import { easings } from '../../../../theme/motion';

export default function RootCta() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #a855f7 100%)',
        py: 14,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AmbientBlobs
        colors={[
          'rgba(255,255,255,0.28)',
          'rgba(255,255,255,0.2)',
          'rgba(255,255,255,0.16)',
          'rgba(255,255,255,0.12)',
        ]}
      />
      <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box sx={glassSx(true, '#c4b5fd', { radius: 4, blur: 28 })}>
            <Box sx={{ p: { xs: 5, md: 7 } }}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
              >
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                  }}
                >
                  <RocketIcon sx={{ fontSize: 32 }} />
                </Box>
              </motion.div>
              <Typography variant="h3" fontWeight={800} mb={2}>{t('home.cta.title')}</Typography>
              <Typography sx={{ opacity: 0.9, mb: 4, fontSize: '1.05rem' }}>
                {t('home.cta.subtitle')}
              </Typography>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={{ duration: 0.15, ease: easings.spring }} style={{ display: 'inline-block' }}>
                <Button
                  variant="contained" size="large" onClick={() => navigate('/superAdmin/login')}
                  sx={{
                    bgcolor: 'white', color: '#6d28d9', px: 5, py: 1.6,
                    borderRadius: 2.5, fontWeight: 700, fontSize: '1rem',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', boxShadow: '0 12px 36px rgba(0,0,0,0.28)' },
                  }}
                  endIcon={<ArrowIcon />}
                >
                  {t('landing.startNow')}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
