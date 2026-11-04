import { Box, Container, Typography, Grid, Stack } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationIcon from '@mui/icons-material/LocationOn';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { getLandingColors, type LandingVariant } from './landingTheme';
import SchoolLogo, { type LogoVariant } from '../common/SchoolLogo';
import type { SchoolTypeConfig } from './landingTypes';
import { easings, durations } from '../../theme/motion';

interface LandingFooterProps {
  config: SchoolTypeConfig;
  schoolName?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  isRoot?: boolean;
}

export default function LandingFooter({ config, schoolName, schoolPhone, schoolAddress, isRoot }: LandingFooterProps) {
  const { mode } = useTheme();
  const { t } = useTranslation();
  const colors = getLandingColors(config.footerVariant as LandingVariant, mode);
  const hairline = mode === 'dark' ? 'rgba(255,255,255,0.09)' : `${config.accentColor}22`;

  const contactIconSx = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    bgcolor: `${config.accentColor}14`,
    border: `1px solid ${config.accentColor}22`,
    color: colors.textSecondary,
    transition: 'background-color 180ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
      bgcolor: `${config.accentColor}22`,
      color: colors.textPrimary,
      transform: 'translateY(-1px)',
    },
  } as const;

  return (
    <Box
      sx={{
        bgcolor: colors.footerBg,
        pt: { xs: 5, md: 6 },
        pb: 3,
        borderTop: '1px solid',
        borderColor: hairline,
        boxShadow: mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: durations.normal / 1000, ease: easings.spring }}
        >
          <Grid container spacing={{ xs: 3.5, md: 5 }} alignItems="flex-start" sx={{ pb: { xs: 3.5, md: 4 } }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                <SchoolLogo
                  variant={(isRoot ? 'root' : config.id) as LogoVariant}
                  size={34}
                  animate={false}
                />
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.textPrimary, letterSpacing: '-0.012em', lineHeight: 1.35 }}>
                  {schoolName || t('common.appName')}
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              {!isRoot && schoolPhone && (
                <Stack
                  direction="row"
                  spacing={{ xs: 1.5, md: 2.5 }}
                  justifyContent={{ xs: 'center', md: 'flex-end' }}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={contactIconSx}>
                      <PhoneIcon sx={{ fontSize: 15 }} />
                    </Box>
                    <Typography variant="caption" className="tnum" sx={{ color: colors.textSecondary, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>{schoolPhone}</Typography>
                  </Stack>
                  {schoolAddress && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={contactIconSx}>
                        <LocationIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.8125rem', lineHeight: 1.5 }}>{schoolAddress}</Typography>
                    </Stack>
                  )}
                </Stack>
              )}
            </Grid>
          </Grid>
          <Box
            sx={{
              pt: 2.5,
              borderTop: '1px solid',
              borderColor: hairline,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.75rem', letterSpacing: '0.01em', lineHeight: 1.6 }}>
              © 2026 {schoolName || t('common.appName')} — {t('landing.footerRights')}
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
