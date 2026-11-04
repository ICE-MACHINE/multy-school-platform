export interface PlatformStats {
  totalSchools: number;
  activeSchools: number;
  frozenSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  schoolTypeBreakdown: { quranic: number; private: number; kindergarten: number };
  recentActivity: ActivityItem[];
  schoolsByType?: { type: string; count: number }[];
  monthlyRegistrations?: { month: string; count: number }[];
  schoolTypes?: { type: string; count: number }[];
  userGrowth?: { date: string; students: number; teachers: number; parents: number }[];
  revenueData?: { month: string; amount: number }[];
}

export interface PublicPlatformStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalClassrooms: number;
  totalActivities: number;
  schoolsByType: { type: string; count: number }[];
}

export interface PublicSchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalClassrooms: number;
  totalActivities: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  schoolId?: string;
}

export interface SchoolDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClassrooms: number;
  totalCourses: number;
  todayAttendance: { absent: number; present: number; rate: string };
  monthlyRevenue: number;
  monthlyPaymentsCount: number;
  monthlyPayments: number;
  monthlyPaymentsData: { month: string; amount: number }[];
  totalPayments: number;
  absentToday: number;
  totalMessages: number;
  unreadMessages: number;
  recentActivities: any[];
}

export interface TeacherDashboardStats {
  assignedClassroom: any;
  assignedCourse?: { id: string; name: string } | null;
  totalStudents: number;
  todayStats: { present: number; absent: number };
  quranStats: { memorized: number; memorizing: number };
  attendanceRate: number;
  monthAttendanceRate: number;
  avgProgress: number;
  avgMemorizedSurahs: number;
  totalMemorizedSurahs: number;
  totalLessonsAttended?: number;
  avgLessonsPerStudent?: number;
  genderDistribution: { gender: string; count: number }[];
  ageDistribution: { age: string; count: number }[];
  progressDistribution: { status: string; count: number }[];
  lessonDistribution?: { status: string; count: number }[];
  monthlyAttendance: { month: string; present: number; absent: number }[];
}

export interface ParentDashboardStats {
  childrenCount: number;
  children: ChildSummary[];
}

export interface ChildSummary {
  id: string;
  name: string;
  classroom?: string;
  attendanceRate: number;
  pendingPayments: number;
  lastActivity?: string;
}
