import { Box } from '@mui/material';
import LandingFooter from '../../../components/landing/LandingFooter';
import LandingNavbar from '../../../components/landing/LandingNavbar';
import { schoolTypeConfigs } from '../../../components/landing/landingTypes';
import RootHero from './sections/RootHero';
import RootFeatures from './sections/RootFeatures';
import RootHowItWorks from './sections/RootHowItWorks';
import RootStats from './sections/RootStats';
import RootCta from './sections/RootCta';

export default function RootLandingPage() {
  const rootConfig = schoolTypeConfigs.private;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <LandingNavbar config={rootConfig} isRoot />

      <RootHero />
      <RootFeatures />
      <RootHowItWorks />
      <RootStats />
      <RootCta />

      <LandingFooter config={rootConfig} isRoot />
    </Box>
  );
}
