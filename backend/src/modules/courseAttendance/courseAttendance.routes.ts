import { Router } from 'express';
import { CourseAttendanceController } from './courseAttendance.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

/**
 * Course-scoped attendance. Mounted at /:schoolId/courses/:id/attendance
 * (courseId available via req.params.id).
 */
const courseRouter = Router({ mergeParams: true });

courseRouter.get('/', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.getAll);
courseRouter.get('/summary', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.getSummary);
courseRouter.get('/sessions/:sessionNumber', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.getBySession);
courseRouter.post('/bulk', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.bulkUpsert);
courseRouter.post('/', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.upsert);
courseRouter.put('/:attendanceId', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.update);
courseRouter.patch('/:attendanceId/justify', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.justify);
courseRouter.delete('/:attendanceId', authenticate, authorize('school_admin', 'teacher'), CourseAttendanceController.remove);

/**
 * Student cross-course attendance. Mounted at /:schoolId/course-attendance.
 * Used by parent (own children), school_admin and teacher.
 */
const studentRouter = Router({ mergeParams: true });

studentRouter.get('/student/:studentId', authenticate, authorize('school_admin', 'teacher', 'parent'), CourseAttendanceController.getStudentCourseAttendance);
studentRouter.get('/student/:studentId/course/:courseId', authenticate, authorize('school_admin', 'teacher', 'parent'), CourseAttendanceController.getStudentCourseDetail);

export { courseRouter, studentRouter };
