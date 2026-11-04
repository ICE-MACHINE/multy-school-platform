import { Box, Container, Typography, Chip, Avatar, Grid, Divider, Stack } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from './landingTheme';
import type { SchoolTypeConfig } from './landingTypes';
import { glassSx, AmbientBlobs, Reveal, fluidStagger, fluidItem } from './landingGlass';
import { easings } from '../../theme/motion';

interface LandingTestimonialsProps {
  config: SchoolTypeConfig;
}

export default function LandingTestimonials({ config }: LandingTestimonialsProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { t } = useTranslation();
  const colors = getLandingColors(config.testimonialVariant as LandingVariant, mode);
  const radius = config.testimonialVariant === 'kindergarten' ? 5 : 3.5;

  return (
    <Box sx={{ py: 10, bgcolor: colors.sectionBg, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs colors={[isDark ? `${config.accentColor}2E` : `${config.accentColor}22`]} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip
              label={config.testimonialVariant === 'kindergarten' ? t('schoolLanding.testimonialsSection.kindergartenChip') : t('landing.testimonials')}
              sx={{ bgcolor: `${config.accentColor}22`, color: config.accentColor, mb: 2, fontWeight: 600 }}
            />
            <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
              {config.testimonialVariant === 'quranic' ? t('schoolLanding.testimonialsSection.quranicTitle') :
               config.testimonialVariant === 'private' ? t('schoolLanding.testimonialsSection.privateTitle') :
               t('schoolLanding.testimonialsSection.kindergartenTitle')}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary }}>
              {config.testimonialVariant === 'kindergarten' ? t('schoolLanding.testimonialsSection.kindergartenSubtitle') :
               t('schoolLanding.testimonialsSection.subtitle')}
            </Typography>
          </Box>
        </Reveal>

        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <Grid container spacing={3}>
            {config.testimonials.map((testimonial, i) => (
              <Grid key={i} size={{ xs: 12, md: 4 }}>
                <motion.div variants={fluidItem}>
                  <Box
                    sx={{
                      ...glassSx(isDark, config.accentColor, { radius, interactive: true }),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" spacing={0.5} mb={2}>
                        {Array.from({ length: testimonial.rating }).map((_, si) => (
                          <motion.div
                            key={si}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1 + si * 0.05, duration: 0.2, ease: easings.spring }}
                          >
                            <StarIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                          </motion.div>
                        ))}
                      </Stack>
                      <Typography
                        variant="body1"
                        sx={{
                          color: colors.textPrimary,
                          mb: 3,
                          flex: 1,
                          lineHeight: 1.8,
                          fontStyle: 'italic',
                          fontSize: 14,
                        }}
                      >
                        "{t(testimonial.text)}"
                      </Typography>
                      <Divider sx={{ borderColor: `${config.accentColor}15`, mb: 2 }} />
                      <Stack direction="row" spacing={2} alignItems="center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.15, ease: easings.spring }}
                        >
                          <Avatar sx={{ bgcolor: testimonial.avatarColor, width: 44, height: 44, fontWeight: 700 }}>
                            {t(testimonial.name).charAt(0)}
                          </Avatar>
                        </motion.div>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.textPrimary }}>{t(testimonial.name)}</Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{t(testimonial.role)}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}
