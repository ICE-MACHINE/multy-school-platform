import type { ReactNode } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import PaymentsIcon from '@mui/icons-material/Payments';
import QuranIcon from '@mui/icons-material/AutoStories';
import CheckIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import AnalyticsIcon from '@mui/icons-material/BarChart';
import BookIcon from '@mui/icons-material/MenuBook';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import ChildIcon from '@mui/icons-material/ChildCare';
import BrainIcon from '@mui/icons-material/Psychology';
import ArtIcon from '@mui/icons-material/Palette';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import ShieldIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';

export interface FeatureItem {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
}

export interface StatItem {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatarColor: string;
}

export interface HighlightItem {
  text: string;
  icon: ReactNode;
}

export interface SchoolTypeConfig {
  id: string;
  label: string;
  heroVariant: 'quranic' | 'private' | 'kindergarten';
  featuresVariant: 'quranic' | 'private' | 'kindergarten';
  statsVariant: 'quranic' | 'private' | 'kindergarten';
  highlightsVariant: 'quranic' | 'private' | 'kindergarten';
  testimonialVariant: 'quranic' | 'private' | 'kindergarten';
  ctaVariant: 'quranic' | 'private' | 'kindergarten';
  navbarVariant: 'quranic' | 'private' | 'kindergarten';
  footerVariant: 'quranic' | 'private' | 'kindergarten';
  gradient: string;
  gradientDark: string;
  gradientLight: string;
  accentColor: string;
  accentLight: string;
  accentDark: string;
  tagline: string;
  subtitle: string;
  aboutText: string;
  features: FeatureItem[];
  stats: StatItem[];
  highlights: HighlightItem[];
  testimonials: TestimonialItem[];
  heroBgPattern: string;
}

// Text fields below hold i18n keys (see src/i18n/fragments/groupB.json);
// consumers must render them through t(), e.g. t(config.tagline).
export const schoolTypeConfigs: Record<string, SchoolTypeConfig> = {
  quranic: {
    id: 'quranic',
    label: 'schoolTypes.quranic',
    heroVariant: 'quranic',
    featuresVariant: 'quranic',
    statsVariant: 'quranic',
    highlightsVariant: 'quranic',
    testimonialVariant: 'quranic',
    ctaVariant: 'quranic',
    navbarVariant: 'quranic',
    footerVariant: 'quranic',
    gradient: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 30%, #7a4a00 60%, #f59e0b 100%)',
    gradientDark: 'linear-gradient(135deg, #0d0500 0%, #1a0a00 50%, #2d1500 100%)',
    gradientLight: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 30%, #fde68a 60%, #f59e0b 100%)',
    accentColor: '#f59e0b',
    accentLight: '#fbbf24',
    accentDark: '#b45309',
    tagline: 'schoolLanding.quranic.tagline',
    subtitle: 'schoolLanding.quranic.subtitle',
    aboutText: 'schoolLanding.quranic.aboutText',
    heroBgPattern: 'radial-gradient(circle at 20% 30%, rgba(245,158,11,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245,158,11,0.1) 0%, transparent 50%)',
    features: [
      { icon: <QuranIcon />, title: 'schoolLanding.quranic.features.surahTracking.title', desc: 'schoolLanding.quranic.features.surahTracking.desc', color: '#f59e0b' },
      { icon: <BookIcon />, title: 'schoolLanding.quranic.features.juzManagement.title', desc: 'schoolLanding.quranic.features.juzManagement.desc', color: '#d97706' },
      { icon: <BrainIcon />, title: 'schoolLanding.quranic.features.tajweedAssessment.title', desc: 'schoolLanding.quranic.features.tajweedAssessment.desc', color: '#b45309' },
      { icon: <CalendarIcon />, title: 'schoolLanding.quranic.features.halaqaScheduling.title', desc: 'schoolLanding.quranic.features.halaqaScheduling.desc', color: '#f59e0b' },
      { icon: <TrendIcon />, title: 'schoolLanding.quranic.features.memorisationStats.title', desc: 'schoolLanding.quranic.features.memorisationStats.desc', color: '#d97706' },
      { icon: <ShieldIcon />, title: 'schoolLanding.quranic.features.parentInvolvement.title', desc: 'schoolLanding.quranic.features.parentInvolvement.desc', color: '#b45309' },
    ],
    stats: [
      { label: 'schoolLanding.quranic.stats.surahsTracked', value: '114', icon: <QuranIcon />, color: '#f59e0b' },
      { label: 'schoolLanding.quranic.stats.activeStudent', value: '150+', icon: <ChildIcon />, color: '#d97706' },
      { label: 'schoolLanding.quranic.stats.retentionRate', value: '95%', icon: <TrendIcon />, color: '#f59e0b' },
      { label: 'schoolLanding.quranic.stats.quranTeacher', value: '12', icon: <SchoolIcon />, color: '#b45309' },
    ],
    highlights: [
      { text: 'schoolLanding.quranic.highlights.trackEverySurah', icon: <QuranIcon /> },
      { text: 'schoolLanding.quranic.highlights.separateReview', icon: <BookIcon /> },
      { text: 'schoolLanding.quranic.highlights.progressReports', icon: <TrendIcon /> },
      { text: 'schoolLanding.quranic.highlights.reviewReminders', icon: <CalendarIcon /> },
      { text: 'schoolLanding.quranic.highlights.qualityRating', icon: <CheckIcon /> },
      { text: 'schoolLanding.quranic.highlights.achievementNotifications', icon: <TrophyIcon /> },
    ],
    testimonials: [
      { name: 'schoolLanding.quranic.testimonials.ummAbdullah.name', role: 'schoolLanding.quranic.testimonials.ummAbdullah.role', text: 'schoolLanding.quranic.testimonials.ummAbdullah.text', rating: 5, avatarColor: '#f59e0b' },
      { name: 'schoolLanding.quranic.testimonials.sheikhOmar.name', role: 'schoolLanding.quranic.testimonials.sheikhOmar.role', text: 'schoolLanding.quranic.testimonials.sheikhOmar.text', rating: 5, avatarColor: '#d97706' },
      { name: 'schoolLanding.quranic.testimonials.abuIbrahim.name', role: 'schoolLanding.quranic.testimonials.abuIbrahim.role', text: 'schoolLanding.quranic.testimonials.abuIbrahim.text', rating: 5, avatarColor: '#b45309' },
    ],
  },
  private: {
    id: 'private',
    label: 'schoolTypes.private',
    heroVariant: 'private',
    featuresVariant: 'private',
    statsVariant: 'private',
    highlightsVariant: 'private',
    testimonialVariant: 'private',
    ctaVariant: 'private',
    navbarVariant: 'private',
    footerVariant: 'private',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4f46e5 60%, #6366f1 100%)',
    gradientDark: 'linear-gradient(135deg, #0f0d2e 0%, #1e1b4b 50%, #312e81 100%)',
    gradientLight: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 30%, #c7d2fe 60%, #818cf8 100%)',
    accentColor: '#6366f1',
    accentLight: '#818cf8',
    accentDark: '#4338ca',
    tagline: 'schoolLanding.private.tagline',
    subtitle: 'schoolLanding.private.subtitle',
    aboutText: 'schoolLanding.private.aboutText',
    heroBgPattern: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%)',
    features: [
      { icon: <BookIcon />, title: 'schoolLanding.private.features.courseManagement.title', desc: 'schoolLanding.private.features.courseManagement.desc', color: '#6366f1' },
      { icon: <PaymentsIcon />, title: 'schoolLanding.private.features.flexiblePayments.title', desc: 'schoolLanding.private.features.flexiblePayments.desc', color: '#4f46e5' },
      { icon: <GroupsIcon />, title: 'schoolLanding.private.features.classroomOrganisation.title', desc: 'schoolLanding.private.features.classroomOrganisation.desc', color: '#4338ca' },
      { icon: <AnalyticsIcon />, title: 'schoolLanding.private.features.analytics.title', desc: 'schoolLanding.private.features.analytics.desc', color: '#6366f1' },
      { icon: <SpeedIcon />, title: 'schoolLanding.private.features.dailyAttendance.title', desc: 'schoolLanding.private.features.dailyAttendance.desc', color: '#4f46e5' },
      { icon: <MessageIcon />, title: 'schoolLanding.private.features.communication.title', desc: 'schoolLanding.private.features.communication.desc', color: '#4338ca' },
    ],
    stats: [
      { label: 'schoolLanding.private.stats.subject', value: '40+', icon: <BookIcon />, color: '#6366f1' },
      { label: 'schoolLanding.private.stats.studentEnrolled', value: '500+', icon: <GroupsIcon />, color: '#4f46e5' },
      { label: 'schoolLanding.private.stats.successRate', value: '98%', icon: <TrophyIcon />, color: '#6366f1' },
      { label: 'schoolLanding.private.stats.qualifiedTeacher', value: '35+', icon: <SchoolIcon />, color: '#4338ca' },
    ],
    highlights: [
      { text: 'schoolLanding.private.highlights.fullCurriculum', icon: <BookIcon /> },
      { text: 'schoolLanding.private.highlights.flexiblePaymentPlans', icon: <PaymentsIcon /> },
      { text: 'schoolLanding.private.highlights.realtimeAttendance', icon: <SpeedIcon /> },
      { text: 'schoolLanding.private.highlights.messagingSystem', icon: <MessageIcon /> },
      { text: 'schoolLanding.private.highlights.detailedReports', icon: <AnalyticsIcon /> },
      { text: 'schoolLanding.private.highlights.comprehensiveProfile', icon: <CheckIcon /> },
    ],
    testimonials: [
      { name: 'schoolLanding.private.testimonials.fatima.name', role: 'schoolLanding.private.testimonials.fatima.role', text: 'schoolLanding.private.testimonials.fatima.text', rating: 5, avatarColor: '#6366f1' },
      { name: 'schoolLanding.private.testimonials.karim.name', role: 'schoolLanding.private.testimonials.karim.role', text: 'schoolLanding.private.testimonials.karim.text', rating: 5, avatarColor: '#4f46e5' },
      { name: 'schoolLanding.private.testimonials.benali.name', role: 'schoolLanding.private.testimonials.benali.role', text: 'schoolLanding.private.testimonials.benali.text', rating: 5, avatarColor: '#4338ca' },
    ],
  },
  kindergarten: {
    id: 'kindergarten',
    label: 'schoolTypes.kindergarten',
    heroVariant: 'kindergarten',
    featuresVariant: 'kindergarten',
    statsVariant: 'kindergarten',
    highlightsVariant: 'kindergarten',
    testimonialVariant: 'kindergarten',
    ctaVariant: 'kindergarten',
    navbarVariant: 'kindergarten',
    footerVariant: 'kindergarten',
    gradient: 'linear-gradient(135deg, #022c22 0%, #065f46 25%, #059669 55%, #10b981 100%)',
    gradientDark: 'linear-gradient(135deg, #01140f 0%, #022c22 50%, #065f46 100%)',
    gradientLight: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 30%, #a7f3d0 60%, #34d399 100%)',
    accentColor: '#10b981',
    accentLight: '#34d399',
    accentDark: '#047857',
    tagline: 'schoolLanding.kindergarten.tagline',
    subtitle: 'schoolLanding.kindergarten.subtitle',
    aboutText: 'schoolLanding.kindergarten.aboutText',
    heroBgPattern: 'radial-gradient(circle at 30% 40%, rgba(16,185,129,0.2) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(52,211,153,0.15) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(251,191,36,0.1) 0%, transparent 30%)',
    features: [
      { icon: <ArtIcon />, title: 'schoolLanding.kindergarten.features.creativeActivities.title', desc: 'schoolLanding.kindergarten.features.creativeActivities.desc', color: '#10b981' },
      { icon: <ChildIcon />, title: 'schoolLanding.kindergarten.features.growthTracking.title', desc: 'schoolLanding.kindergarten.features.growthTracking.desc', color: '#059669' },
      { icon: <StarIcon />, title: 'schoolLanding.kindergarten.features.rewardsSystem.title', desc: 'schoolLanding.kindergarten.features.rewardsSystem.desc', color: '#047857' },
      { icon: <CalendarIcon />, title: 'schoolLanding.kindergarten.features.activityCalendar.title', desc: 'schoolLanding.kindergarten.features.activityCalendar.desc', color: '#10b981' },
      { icon: <GroupsIcon />, title: 'schoolLanding.kindergarten.features.smallClasses.title', desc: 'schoolLanding.kindergarten.features.smallClasses.desc', color: '#059669' },
      { icon: <MessageIcon />, title: 'schoolLanding.kindergarten.features.dailyCommunication.title', desc: 'schoolLanding.kindergarten.features.dailyCommunication.desc', color: '#047857' },
    ],
    stats: [
      { label: 'schoolLanding.kindergarten.stats.interactiveActivity', value: '200+', icon: <ArtIcon />, color: '#10b981' },
      { label: 'schoolLanding.kindergarten.stats.happyChild', value: '80+', icon: <ChildIcon />, color: '#059669' },
      { label: 'schoolLanding.kindergarten.stats.parentSatisfaction', value: '99%', icon: <StarIcon />, color: '#10b981' },
      { label: 'schoolLanding.kindergarten.stats.activityPerWeek', value: '15', icon: <CalendarIcon />, color: '#047857' },
    ],
    highlights: [
      { text: 'schoolLanding.kindergarten.highlights.playBasedLearning', icon: <ArtIcon /> },
      { text: 'schoolLanding.kindergarten.highlights.dailyPhotoUpdates', icon: <MessageIcon /> },
      { text: 'schoolLanding.kindergarten.highlights.monthlyGrowthReports', icon: <TrendIcon /> },
      { text: 'schoolLanding.kindergarten.highlights.safeEnvironment', icon: <ShieldIcon /> },
      { text: 'schoolLanding.kindergarten.highlights.qualifiedEducators', icon: <VerifiedIcon /> },
      { text: 'schoolLanding.kindergarten.highlights.educationalTrips', icon: <StarIcon /> },
    ],
    testimonials: [
      { name: 'schoolLanding.kindergarten.testimonials.ummKhaled.name', role: 'schoolLanding.kindergarten.testimonials.ummKhaled.role', text: 'schoolLanding.kindergarten.testimonials.ummKhaled.text', rating: 5, avatarColor: '#10b981' },
      { name: 'schoolLanding.kindergarten.testimonials.amina.name', role: 'schoolLanding.kindergarten.testimonials.amina.role', text: 'schoolLanding.kindergarten.testimonials.amina.text', rating: 5, avatarColor: '#059669' },
      { name: 'schoolLanding.kindergarten.testimonials.rachid.name', role: 'schoolLanding.kindergarten.testimonials.rachid.role', text: 'schoolLanding.kindergarten.testimonials.rachid.text', rating: 5, avatarColor: '#047857' },
    ],
  },
};
