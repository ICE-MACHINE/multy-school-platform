import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AuthGuard from '../guards/AuthGuard';
import GuestGuard from '../guards/GuestGuard';
import RoleGuard from '../guards/RoleGuard';
import SchoolGuard from '../guards/SchoolGuard';

// Layouts (lazy: public/landing pages must not pay for the dashboard shell)
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));

// Lazy load pages
const RootLandingPage = lazy(() => import('../views/landing/RootLandingPage'));
const SchoolLandingPage = lazy(() => import('../views/landing/SchoolLandingPage'));
const SuperAdminLogin = lazy(() => import('../views/landing/Login/SuperAdminLogin'));
const SchoolLogin = lazy(() => import('../views/landing/Login/SchoolLogin'));

// Super Admin
const SuperAdminDashboard = lazy(() => import('../views/superAdmin/SuperAdminDashboard'));
const SchoolsListPage = lazy(() => import('../views/superAdmin/Schools/SchoolsListPage'));
const CreateSchoolPage = lazy(() => import('../views/superAdmin/Schools/CreateSchoolPage'));
const SchoolDetailPage = lazy(() => import('../views/superAdmin/Schools/SchoolDetailPage'));
const EditSchoolPage = lazy(() => import('../views/superAdmin/Schools/EditSchoolPage'));
const AnalyticsPage = lazy(() => import('../views/superAdmin/Analytics/AnalyticsPage'));
const AiAssistantPage = lazy(() => import('../views/superAdmin/AiAssistant/AiAssistantPage'));

// School Admin
const SchoolAdminDashboard = lazy(() => import('../views/schoolAdmin/SchoolAdminDashboard'));
const TeachersListPage = lazy(() => import('../views/schoolAdmin/Teachers/TeachersListPage'));
const CreateTeacherPage = lazy(() => import('../views/schoolAdmin/Teachers/CreateTeacherPage'));
const TeacherDetailPage = lazy(() => import('../views/schoolAdmin/Teachers/TeacherDetailPage'));
const ParentsListPage = lazy(() => import('../views/schoolAdmin/Parents/ParentsListPage'));
const CreateParentPage = lazy(() => import('../views/schoolAdmin/Parents/CreateParentPage'));
const ParentDetailPage = lazy(() => import('../views/schoolAdmin/Parents/ParentDetailPage'));
const StudentsListPage = lazy(() => import('../views/schoolAdmin/Students/StudentsListPage'));
const CreateStudentPage = lazy(() => import('../views/schoolAdmin/Students/CreateStudentPage'));
const StudentDetailPage = lazy(() => import('../views/schoolAdmin/Students/StudentDetailPage'));
const ClassroomsListPage = lazy(() => import('../views/schoolAdmin/Classrooms/ClassroomsListPage'));
const ClassroomDetailPage = lazy(() => import('../views/schoolAdmin/Classrooms/ClassroomDetailPage'));
const CreateClassroomPage = lazy(() => import('../views/schoolAdmin/Classrooms/CreateClassroomPage'));
const CoursesListPage = lazy(() => import('../views/schoolAdmin/Courses/CoursesListPage'));
const CourseDetailPage = lazy(() => import('../views/schoolAdmin/Courses/CourseDetailPage'));
const CreateCoursePage = lazy(() => import('../views/schoolAdmin/Courses/CreateCoursePage'));
const PaymentsListPage = lazy(() => import('../views/schoolAdmin/Payments/PaymentsListPage'));
const RecordPaymentPage = lazy(() => import('../views/schoolAdmin/Payments/RecordPaymentPage'));
const ReceiptPage = lazy(() => import('../views/schoolAdmin/Payments/ReceiptPage'));
const PaymentsReportPage = lazy(() => import('../views/schoolAdmin/Payments/PaymentsReportPage'));
const AdminAttendancePage = lazy(() => import('../views/schoolAdmin/Attendance/AttendancePage'));
const AdminMessagesPage = lazy(() => import('../views/schoolAdmin/Messages/MessagesPage'));
const AdminNotificationsPage = lazy(() => import('../views/schoolAdmin/Notifications/NotificationsPage'));
const SchoolSettingsPage = lazy(() => import('../views/schoolAdmin/Settings/SchoolSettingsPage'));
const AiInsightsPage = lazy(() => import('../views/schoolAdmin/Ai/AiInsightsPage'));
const AiDocumentsPage = lazy(() => import('../views/schoolAdmin/Ai/AiDocumentsPage'));
const TimetablePage = lazy(() => import('../views/schoolAdmin/Timetable/TimetablePage'));
const TimetableSettingsPage = lazy(() => import('../views/schoolAdmin/Timetable/TimetableSettingsPage'));

// Teacher
const TeacherDashboard = lazy(() => import('../views/teacher/TeacherDashboard'));
const TeacherProgressPage = lazy(() => import('../views/teacher/StudentProgress/ProgressListPage'));
const StudentProgressDetail = lazy(() => import('../views/teacher/StudentProgress/StudentProgressDetail'));
const TeacherAttendancePage = lazy(() => import('../views/teacher/Attendance/AttendancePage'));
const StudentAbsencesPage = lazy(() => import('../views/teacher/Attendance/StudentAbsencesPage'));
const ProgramPage = lazy(() => import('../views/teacher/Program/ProgramPage'));
const ActivitiesPage = lazy(() => import('../views/teacher/Activities/ActivitiesPage'));
const TeacherMessagesPage = lazy(() => import('../views/teacher/Messages/MessagesPage'));
const TeacherNotificationsPage = lazy(() => import('../views/teacher/Notifications/NotificationsPage'));
const TeacherTimetable = lazy(() => import('../views/teacher/Timetable/TeacherTimetable'));

// Parent
const ParentDashboard = lazy(() => import('../views/parent/ParentDashboard'));
const ChildProgress = lazy(() => import('../views/parent/ChildDetail/ChildProgress'));
const ChildAttendance = lazy(() => import('../views/parent/ChildDetail/ChildAttendance'));
const ParentMessagesPage = lazy(() => import('../views/parent/Messages/MessagesPage'));
const ParentNotificationsPage = lazy(() => import('../views/parent/Notifications/NotificationsPage'));
const ParentTimetable = lazy(() => import('../views/parent/ChildDetail/ParentTimetable'));

// Shared
const ProfilePage = lazy(() => import('../views/shared/Profile/ProfilePage'));

const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress size={48} />
  </Box>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootLandingPage />} />
        <Route path="/s/:schoolId" element={<SchoolLandingPage />} />
        <Route path="/superAdmin/login" element={<GuestGuard><SuperAdminLogin /></GuestGuard>} />
        <Route path="/s/:schoolId/login" element={<GuestGuard><SchoolLogin /></GuestGuard>} />

        {/* Super Admin Routes */}
        <Route path="/superAdmin" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['super_admin']}>
              <DashboardLayout role="super_admin" />
            </RoleGuard>
          </AuthGuard>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="schools" element={<SchoolsListPage />} />
          <Route path="schools/create" element={<CreateSchoolPage />} />
          <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
          <Route path="schools/:schoolId/edit" element={<EditSchoolPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* School Admin Routes */}
        <Route path="/s/:schoolId/admin" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['school_admin']}>
              <SchoolGuard>
                <DashboardLayout role="school_admin" />
              </SchoolGuard>
            </RoleGuard>
          </AuthGuard>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SchoolAdminDashboard />} />
          <Route path="teachers" element={<TeachersListPage />} />
          <Route path="teachers/create" element={<CreateTeacherPage />} />
          <Route path="teachers/:id" element={<TeacherDetailPage />} />
          <Route path="parents" element={<ParentsListPage />} />
          <Route path="parents/create" element={<CreateParentPage />} />
          <Route path="parents/:id" element={<ParentDetailPage />} />
          <Route path="students" element={<StudentsListPage />} />
          <Route path="students/create" element={<CreateStudentPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="classrooms" element={<ClassroomsListPage />} />
          <Route path="classrooms/create" element={<CreateClassroomPage />} />
          <Route path="classrooms/:id" element={<ClassroomDetailPage />} />
          <Route path="courses" element={<CoursesListPage />} />
          <Route path="courses/create" element={<CreateCoursePage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="payments" element={<PaymentsListPage />} />
          <Route path="payments/record" element={<RecordPaymentPage />} />
          <Route path="attendance" element={<AdminAttendancePage />} />
          <Route path="ai-insights" element={<AiInsightsPage />} />
          <Route path="ai-documents" element={<AiDocumentsPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="timetable/settings" element={<TimetableSettingsPage />} />
          <Route path="settings" element={<SchoolSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/s/:schoolId/teacher" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['teacher']}>
              <SchoolGuard>
                <DashboardLayout role="teacher" />
              </SchoolGuard>
            </RoleGuard>
          </AuthGuard>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="progress" element={<TeacherProgressPage />} />
          <Route path="progress/:studentId" element={<StudentProgressDetail />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="attendance/:studentId" element={<StudentAbsencesPage />} />
          <Route path="program" element={<ProgramPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="messages" element={<TeacherMessagesPage />} />
          <Route path="notifications" element={<TeacherNotificationsPage />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Parent Routes */}
        <Route path="/s/:schoolId/parent" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['parent']}>
              <SchoolGuard>
                <DashboardLayout role="parent" />
              </SchoolGuard>
            </RoleGuard>
          </AuthGuard>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path=":childId/progress" element={<ChildProgress />} />
          <Route path=":childId/attendance" element={<ChildAttendance />} />
          <Route path="timetable" element={<ParentTimetable />} />
          <Route path="messages" element={<ParentMessagesPage />} />
          <Route path="notifications" element={<ParentNotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Standalone Routes */}
        <Route path="/s/:schoolId/admin/payments/receipt/:id" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['school_admin', 'parent']}>
              <SchoolGuard>
                <ReceiptPage />
              </SchoolGuard>
            </RoleGuard>
          </AuthGuard>
        } />
        <Route path="/s/:schoolId/admin/payments/print" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['school_admin']}>
              <SchoolGuard>
                <PaymentsReportPage />
              </SchoolGuard>
            </RoleGuard>
          </AuthGuard>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
