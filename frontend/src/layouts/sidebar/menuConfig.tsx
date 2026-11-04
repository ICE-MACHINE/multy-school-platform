import type { ReactNode } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import ChildIcon from '@mui/icons-material/ChildCare';
import ClassroomIcon from '@mui/icons-material/Class';
import BookIcon from '@mui/icons-material/Book';
import PaymentIcon from '@mui/icons-material/Payment';
import AttendanceIcon from '@mui/icons-material/CheckCircle';
import MessageIcon from '@mui/icons-material/Message';
import AnalyticsIcon from '@mui/icons-material/BarChart';
import ActivityIcon from '@mui/icons-material/EmojiObjects';
import QuranIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import TimetableIcon from '@mui/icons-material/Schedule';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';

export const SIDEBAR_WIDTH = 256;

export type Role = 'super_admin' | 'school_admin' | 'teacher' | 'parent';

export interface MenuItemDef {
  labelKey: string;
  icon: ReactNode;
  path: string;
}

export interface MenuGroupDef {
  groupLabelKey: string;
  items: MenuItemDef[];
}

export function getMenuItems(role: Role, schoolId?: string, schoolType?: string | null): MenuItemDef[] {
  const base = `/s/${schoolId}`;
  switch (role) {
    case 'super_admin':
      return [
        { labelKey: 'nav.dashboard', icon: <DashboardIcon />, path: '/superAdmin/dashboard' },
        { labelKey: 'nav.schools', icon: <SchoolIcon />, path: '/superAdmin/schools' },
        { labelKey: 'nav.analytics', icon: <AnalyticsIcon />, path: '/superAdmin/analytics' },
        { labelKey: 'nav.aiAssistant', icon: <SmartToyIcon />, path: '/superAdmin/ai-assistant' },
      ];
    case 'school_admin': {
      const items: MenuItemDef[] = [
        { labelKey: 'nav.dashboard', icon: <DashboardIcon />, path: `${base}/admin/dashboard` },
        { labelKey: 'nav.teachers', icon: <PeopleIcon />, path: `${base}/admin/teachers` },
        { labelKey: 'nav.parents', icon: <FamilyIcon />, path: `${base}/admin/parents` },
        { labelKey: 'nav.students', icon: <ChildIcon />, path: `${base}/admin/students` },
      ];
      if (schoolType === 'private') {
        items.push({ labelKey: 'nav.courses', icon: <BookIcon />, path: `${base}/admin/courses` });
      } else {
        items.push({ labelKey: 'nav.classrooms', icon: <ClassroomIcon />, path: `${base}/admin/classrooms` });
      }
      items.push(
        { labelKey: 'nav.payments', icon: <PaymentIcon />, path: `${base}/admin/payments` },
        { labelKey: 'nav.attendance', icon: <AttendanceIcon />, path: `${base}/admin/attendance` },
        { labelKey: 'nav.aiInsights', icon: <SmartToyIcon />, path: `${base}/admin/ai-insights` },
        { labelKey: 'nav.aiDocuments', icon: <DocumentScannerIcon />, path: `${base}/admin/ai-documents` },
        { labelKey: 'nav.timetable', icon: <TimetableIcon />, path: `${base}/admin/timetable` },
        { labelKey: 'nav.messages', icon: <MessageIcon />, path: `${base}/admin/messages` },
        { labelKey: 'nav.settings', icon: <SettingsIcon />, path: `${base}/admin/settings` },
      );
      return items;
    }
    case 'teacher': {
      const items: MenuItemDef[] = [
        { labelKey: 'nav.dashboard', icon: <DashboardIcon />, path: `${base}/teacher/dashboard` },
        { labelKey: 'nav.studentProgress', icon: <QuranIcon />, path: `${base}/teacher/progress` },
        { labelKey: 'nav.attendance', icon: <AttendanceIcon />, path: `${base}/teacher/attendance` },
        { labelKey: 'nav.timetable', icon: <TimetableIcon />, path: `${base}/teacher/timetable` },
        { labelKey: 'nav.messages', icon: <MessageIcon />, path: `${base}/teacher/messages` },
      ];
      if (schoolType === 'private') {
        items.push({ labelKey: 'nav.program', icon: <BookIcon />, path: `${base}/teacher/program` });
      }
      if (schoolType === 'kindergarten') {
        items.push({ labelKey: 'nav.activities', icon: <ActivityIcon />, path: `${base}/teacher/activities` });
      }
      return items;
    }
    case 'parent':
      return [
        { labelKey: 'nav.myChildren', icon: <ChildIcon />, path: `${base}/parent/dashboard` },
        { labelKey: 'nav.timetable', icon: <TimetableIcon />, path: `${base}/parent/timetable` },
        { labelKey: 'nav.messages', icon: <MessageIcon />, path: `${base}/parent/messages` },
      ];
  }
}

export function groupMenuItems(items: MenuItemDef[], role: Role): MenuGroupDef[] {
  if (role === 'super_admin' || role === 'parent') {
    return [{ groupLabelKey: '', items }];
  }
  const groups: MenuGroupDef[] = [];
  const primaryItems = items.slice(0, 4);
  const secondaryItems = items.slice(4);
  if (primaryItems.length) groups.push({ groupLabelKey: 'nav.main', items: primaryItems });
  if (secondaryItems.length) groups.push({ groupLabelKey: 'nav.management', items: secondaryItems });
  return groups;
}
