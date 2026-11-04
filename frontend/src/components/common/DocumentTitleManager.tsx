import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchool } from '../../hooks/useSchool';

function findTitle(pathname: string, routes: Array<[RegExp, string]>): string | null {
  for (const [pattern, titleKey] of routes) {
    if (pattern.test(pathname)) return titleKey;
  }
  return null;
}

const SUPER_ADMIN_ROUTES: Array<[RegExp, string]> = [
  [/^\/superAdmin\/login$/, 'titles.superAdminLogin'],
  [/^\/superAdmin\/schools\/create$/, 'titles.createSchool'],
  [/^\/superAdmin\/schools\/[^/]+\/edit$/, 'titles.editSchool'],
  [/^\/superAdmin\/schools\/[^/]+$/, 'titles.schoolDetails'],
  [/^\/superAdmin\/schools$/, 'titles.schools'],
  [/^\/superAdmin\/analytics$/, 'titles.analytics'],
  [/^\/superAdmin\/ai-assistant$/, 'titles.aiAssistant'],
  [/^\/superAdmin\/profile$/, 'titles.profile'],
  [/^\/superAdmin\/dashboard$/, 'titles.dashboard'],
];

const SCHOOL_ROUTES: Array<[RegExp, string]> = [
  [/^\/s\/[^/]+\/?$/, ''],
  [/^\/s\/[^/]+\/login$/, 'titles.schoolLogin'],
  [/^\/s\/[^/]+\/admin\/dashboard$/, 'titles.dashboard'],
  [/^\/s\/[^/]+\/admin\/teachers\/create$/, 'titles.createTeacher'],
  [/^\/s\/[^/]+\/admin\/teachers\/[^/]+$/, 'titles.teacherDetails'],
  [/^\/s\/[^/]+\/admin\/teachers$/, 'titles.teachers'],
  [/^\/s\/[^/]+\/admin\/parents\/create$/, 'titles.createParent'],
  [/^\/s\/[^/]+\/admin\/parents\/[^/]+$/, 'titles.parentDetails'],
  [/^\/s\/[^/]+\/admin\/parents$/, 'titles.parents'],
  [/^\/s\/[^/]+\/admin\/students\/create$/, 'titles.createStudent'],
  [/^\/s\/[^/]+\/admin\/students\/[^/]+$/, 'titles.studentDetails'],
  [/^\/s\/[^/]+\/admin\/students$/, 'titles.students'],
  [/^\/s\/[^/]+\/admin\/classrooms\/create$/, 'titles.createClassroom'],
  [/^\/s\/[^/]+\/admin\/classrooms\/[^/]+$/, 'titles.classroomDetails'],
  [/^\/s\/[^/]+\/admin\/classrooms$/, 'titles.classrooms'],
  [/^\/s\/[^/]+\/admin\/courses\/create$/, 'titles.createCourse'],
  [/^\/s\/[^/]+\/admin\/courses\/[^/]+$/, 'titles.courseDetails'],
  [/^\/s\/[^/]+\/admin\/courses$/, 'titles.courses'],
  [/^\/s\/[^/]+\/admin\/payments\/record$/, 'titles.recordPayment'],
  [/^\/s\/[^/]+\/admin\/payments\/receipt\/[^/]+$/, 'titles.receipt'],
  [/^\/s\/[^/]+\/admin\/payments$/, 'titles.payments'],
  [/^\/s\/[^/]+\/admin\/attendance$/, 'titles.attendance'],
  [/^\/s\/[^/]+\/admin\/ai-insights$/, 'titles.aiInsights'],
  [/^\/s\/[^/]+\/admin\/ai-documents$/, 'titles.aiDocuments'],
  [/^\/s\/[^/]+\/admin\/activities$/, 'titles.activities'],
  [/^\/s\/[^/]+\/admin\/messages$/, 'titles.messages'],
  [/^\/s\/[^/]+\/admin\/notifications$/, 'titles.notifications'],
  [/^\/s\/[^/]+\/admin\/settings$/, 'titles.settings'],
  [/^\/s\/[^/]+\/admin\/profile$/, 'titles.profile'],
  [/^\/s\/[^/]+\/teacher\/dashboard$/, 'titles.teacherDashboard'],
  [/^\/s\/[^/]+\/teacher\/progress\/[^/]+$/, 'titles.studentProgress'],
  [/^\/s\/[^/]+\/teacher\/progress$/, 'titles.studentsProgress'],
  [/^\/s\/[^/]+\/teacher\/attendance$/, 'titles.attendance'],
  [/^\/s\/[^/]+\/teacher\/program$/, 'titles.program'],
  [/^\/s\/[^/]+\/teacher\/activities$/, 'titles.activities'],
  [/^\/s\/[^/]+\/teacher\/messages$/, 'titles.messages'],
  [/^\/s\/[^/]+\/teacher\/notifications$/, 'titles.notifications'],
  [/^\/s\/[^/]+\/teacher\/profile$/, 'titles.profile'],
  [/^\/s\/[^/]+\/parent\/dashboard$/, 'titles.myChildren'],
  [/^\/s\/[^/]+\/parent\/[^/]+\/progress$/, 'titles.childProgress'],
  [/^\/s\/[^/]+\/parent\/[^/]+\/attendance$/, 'titles.attendanceRecord'],
  [/^\/s\/[^/]+\/parent\/messages$/, 'titles.messages'],
  [/^\/s\/[^/]+\/parent\/notifications$/, 'titles.notifications'],
  [/^\/s\/[^/]+\/parent\/profile$/, 'titles.profile'],
];

export default function DocumentTitleManager() {
  const { t } = useTranslation();
  const location = useLocation();
  const { currentSchool } = useSchool();

  useEffect(() => {
    const platformName = t('common.appName');
    const { pathname } = location;

    if (pathname === '/') {
      document.title = platformName;
      return;
    }

    if (pathname.startsWith('/superAdmin')) {
      const pageKey = findTitle(pathname, SUPER_ADMIN_ROUTES);
      const page = pageKey ? t(pageKey) : t('titles.dashboard');
      document.title = `${page} | ${platformName}`;
      return;
    }

    const schoolName = currentSchool?.name;
    const pageKey = findTitle(pathname, SCHOOL_ROUTES);
    const page = pageKey ? t(pageKey) : null;

    if (schoolName) {
      document.title = page ? `${schoolName} | ${page}` : schoolName;
    } else if (page) {
      document.title = page;
    } else {
      document.title = platformName;
    }
  }, [location.pathname, currentSchool?.name, t]);

  return null;
}
