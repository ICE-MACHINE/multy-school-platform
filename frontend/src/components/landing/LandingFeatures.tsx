import { Box, Container, Typography, Chip, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from './landingTheme';
import type { SchoolTypeConfig } from './landingTypes';
import { glassSx, AmbientBlobs, Reveal, fluidStagger, fluidItem } from './landingGlass';

interface LandingFeaturesProps {
  config: SchoolTypeConfig;
}

function useFeaturesColors(config: SchoolTypeConfig) {
  const { mode } = useTheme();
  return {
    isDark: mode === 'dark',
    colors: getLandingColors(config.featuresVariant as LandingVariant, mode),
  };
}

function QuranicFeatures({ config }: LandingFeaturesProps) {
  const { isDark, colors } = useFeaturesColors(config);
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 12, bgcolor: colors.sectionBg, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.16)',
          isDark ? 'rgba(217,119,6,0.16)' : 'rgba(217,119,6,0.12)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip label={t('landing.features')} sx={{ bgcolor: `${config.accentColor}22`, color: config.accentColor, mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: colors.headingAccent, mb: 2 }}>
              {t('schoolLanding.quranicFeatures.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, maxWidth: 600, mx: 'auto' }}>
              {t('schoolLanding.quranicFeatures.subtitle')}
            </Typography>
          </Box>
        </Reveal>

        {config.features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: i % 2 === 0 ? 'row' : 'row-reverse' },
                alignItems: 'center',
                gap: 4,
                mb: i < config.features.length - 1 ? 4 : 0,
                p: 4,
                ...glassSx(isDark, feature.color, { radius: 3.5, interactive: true }),
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <Box
                  sx={{
                    bgcolor: `${feature.color}${isDark ? '2E' : '1A'}`,
                    color: feature.color,
                    width: 76,
                    height: 76,
                    borderRadius: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isDark ? `0 12px 30px ${feature.color}40` : `0 12px 30px ${feature.color}2E`,
                  }}
                >
                  {feature.icon}
                </Box>
              </motion.div>
              <Box sx={{ textAlign: i % 2 === 0 ? 'right' : 'left', flex: 1 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: isDark ? feature.color : colors.headingAccent, mb: 1 }}>
                  {t(feature.title)}
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textSecondary, lineHeight: 1.8 }}>
                  {t(feature.desc)}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </Container>
    </Box>
  );
}

function PrivateFeatures({ config }: LandingFeaturesProps) {
  const { isDark, colors } = useFeaturesColors(config);
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 12, bgcolor: colors.sectionBg, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.16)',
          isDark ? 'rgba(129,140,248,0.16)' : 'rgba(129,140,248,0.12)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip label={t('landing.features')} sx={{ bgcolor: `${config.accentColor}22`, color: config.accentColor, mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: colors.textPrimary, mb: 2 }}>
              {t('schoolLanding.privateFeatures.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, maxWidth: 600, mx: 'auto' }}>
              {t('schoolLanding.privateFeatures.subtitle')}
            </Typography>
          </Box>
        </Reveal>

        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <Grid container spacing={3}>
            {config.features.map((feature, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div variants={fluidItem}>
                  <Box sx={{ ...glassSx(isDark, feature.color, { radius: 3.5, interactive: true }), height: '100%' }}>
                    <Box sx={{ p: 4, height: '100%' }}>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Box
                          sx={{
                            bgcolor: `${feature.color}${isDark ? '2E' : '1A'}`,
                            color: feature.color,
                            width: 56,
                            height: 56,
                            borderRadius: '17px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2.5,
                            boxShadow: isDark ? `0 8px 22px ${feature.color}3D` : `0 8px 22px ${feature.color}2E`,
                          }}
                        >
                          {feature.icon}
                        </Box>
                      </motion.div>
                      <Typography variant="h6" fontWeight={700} sx={{ color: colors.textPrimary, mb: 1 }}>
                        {t(feature.title)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.textSecondary, lineHeight: 1.7 }}>
                        {t(feature.desc)}
                      </Typography>
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

function KindergartenFeatures({ config }: LandingFeaturesProps) {
  const { isDark, colors } = useFeaturesColors(config);
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 12, bgcolor: colors.sectionBg, position: 'relative', overflow: 'hidden' }}>
      <AmbientBlobs
        colors={[
          isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.16)',
          isDark ? 'rgba(251,191,36,0.16)' : 'rgba(251,191,36,0.12)',
          isDark ? 'rgba(255,126,182,0.12)' : 'rgba(255,126,182,0.1)',
        ]}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <Box mb={8} sx={{ textAlign: 'center' }}>
            <Chip label={t('schoolLanding.kindergartenFeatures.chip')} sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: isDark ? '#34d399' : '#047857', mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{ mb: 2, color: isDark ? '#fde68a' : '#047857' }}>
              {t('schoolLanding.kindergartenFeatures.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, maxWidth: 600, mx: 'auto' }}>
              {t('schoolLanding.kindergartenFeatures.subtitle')}
            </Typography>
          </Box>
        </Reveal>

        <motion.div variants={fluidStagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <Grid container spacing={3}>
            {config.features.map((feature, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div variants={fluidItem}>
                  <Box sx={{ ...glassSx(isDark, feature.color, { radius: 5, interactive: true }), height: '100%', textAlign: 'center', p: 2 }}>
                    <Box sx={{ p: 2 }}>
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                      >
                        <Box
                          sx={{
                            bgcolor: `${feature.color}${isDark ? '2E' : '1A'}`,
                            color: feature.color,
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            mx: 'auto',
                            boxShadow: isDark ? `0 10px 26px ${feature.color}3D` : `0 10px 26px ${feature.color}2E`,
                          }}
                        >
                          {feature.icon}
                        </Box>
                      </motion.div>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: isDark ? '#fde68a' : '#047857' }}>
                        {t(feature.title)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.textSecondary, lineHeight: 1.7 }}>
                        {t(feature.desc)}
                      </Typography>
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

export default function LandingFeatures(props: LandingFeaturesProps) {
  const featureMap = {
    quranic: QuranicFeatures,
    private: PrivateFeatures,
    kindergarten: KindergartenFeatures,
  };
  const Component = featureMap[props.config.featuresVariant];
  return <Component {...props} />;
}
