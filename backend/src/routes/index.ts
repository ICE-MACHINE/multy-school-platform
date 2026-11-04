import { Router } from 'express';
import authRoutes from './auth.routes';
import superAdminRoutes from '../modules/superAdmin/superAdmin.routes';
import schoolRoutes from '../modules/school/school.routes';
import schoolAdminRoutes from '../modules/schoolAdmin/schoolAdmin.routes';
import teacherRoutes from '../modules/teacher/teacher.routes';
import parentRoutes from '../modules/parent/parent.routes';
import studentRoutes from '../modules/student/student.routes';
import classroomRoutes from '../modules/classroom/classroom.routes';
import courseRoutes from '../modules/course/course.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import quranProgressRoutes from '../modules/quranProgress/quranProgress.routes';
import programRoutes from '../modules/program/program.routes';
import activityRoutes from '../modules/activity/activity.routes';
import messageRoutes from '../modules/message/message.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import statsRoutes from '../modules/stats/stats.routes';
import lessonRoutes from '../modules/lesson/lesson.routes';
import timetableRoutes from '../modules/timetable/timetable.routes';
import aiRoutes from '../modules/ai/ai.routes';
import superAdminAiRoutes from '../modules/ai/superAdminAi.routes';
import { studentRouter as courseAttendanceStudentRouter } from '../modules/courseAttendance/courseAttendance.routes';
import publicRoutes from './public.routes';
import { resolveSchoolId } from '../shared/middleware/resolveSchool.middleware';

const router = Router();

// Auth routes FIRST (no params to conflict)
router.use('/auth', authRoutes);

// Public routes (no auth) — rate-limited and sanitized
router.use('/public', publicRoutes);

// Fixed routes
router.use('/super-admin/ai', superAdminAiRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/schools', schoolRoutes);

// Parametric routes (resolveSchoolId converts slug → UUID)
router.use('/:schoolId/admin', resolveSchoolId, schoolAdminRoutes);
router.use('/:schoolId/teacher', resolveSchoolId, teacherRoutes);
router.use('/:schoolId/parent', resolveSchoolId, parentRoutes);
router.use('/:schoolId/students', resolveSchoolId, studentRoutes);
router.use('/:schoolId/classrooms', resolveSchoolId, classroomRoutes);
router.use('/:schoolId/courses', resolveSchoolId, courseRoutes);
router.use('/:schoolId/attendance', resolveSchoolId, attendanceRoutes);
router.use('/:schoolId/payments', resolveSchoolId, paymentRoutes);
router.use('/:schoolId/quran', resolveSchoolId, quranProgressRoutes);
router.use('/:schoolId/programs', resolveSchoolId, programRoutes);
router.use('/:schoolId/activities', resolveSchoolId, activityRoutes);
router.use('/:schoolId/messages', resolveSchoolId, messageRoutes);
router.use('/:schoolId/notifications', resolveSchoolId, notificationRoutes);
router.use('/:schoolId/stats', resolveSchoolId, statsRoutes);
router.use('/:schoolId/lessons', resolveSchoolId, lessonRoutes);
router.use('/:schoolId/timetable', resolveSchoolId, timetableRoutes);
router.use('/:schoolId/course-attendance', resolveSchoolId, courseAttendanceStudentRouter);
router.use('/:schoolId/ai', resolveSchoolId, aiRoutes);

export default router;
