import type { SchoolTypeConfig } from './landingTypes';
import QuranicHero from './hero/QuranicHero';
import PrivateHero from './hero/PrivateHero';
import KindergartenHero from './hero/KindergartenHero';

interface LandingHeroProps {
  config: SchoolTypeConfig;
  schoolName?: string;
  schoolPhone?: string;
  schoolId?: string;
  isRoot?: boolean;
}

export default function LandingHero(props: LandingHeroProps) {
  const heroMap = {
    quranic: QuranicHero,
    private: PrivateHero,
    kindergarten: KindergartenHero,
  };
  const Component = heroMap[props.config.heroVariant];
  return <Component {...props} />;
}
