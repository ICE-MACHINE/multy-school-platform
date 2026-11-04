import { Router } from 'express';
import { CourseController } from './course.controller';
import { CourseSessionController } from '../courseSession/courseSession.controller';
import { courseRouter as courseAttendanceRouter } from '../courseAttendance/courseAttendance.routes';
import { StudentController } from '../student/student.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.use('/:id/attendance', courseAttendanceRouter);

router.get('/', authenticate, authorize('school_admin', 'teacher'), CourseController.getAll);
router.get('/:id', authenticate, authorize('school_admin', 'teacher'), CourseController.getById);
router.get('/:id/students', authenticate, authorize('school_admin', 'teacher'), CourseController.getEnrolledStudents);
router.post('/', authenticate, authorize('school_admin'), CourseController.create);
router.put('/:id', authenticate, authorize('school_admin'), CourseController.update);
router.delete('/:id', authenticate, authorize('school_admin'), CourseController.delete);
router.post('/:id/enroll', authenticate, authorize('school_admin'), CourseController.enrollStudent);
router.get('/:id/unenroll-preview/:studentId', authenticate, authorize('school_admin'), CourseController.getUnenrollPreview);
router.delete('/:id/unenroll/:studentId', authenticate, authorize('school_admin'), CourseController.unenrollStudent);

router.get('/:id/sessions', authenticate, authorize('school_admin', 'teacher'), CourseSessionController.getSessions);
router.post('/:id/sessions', authenticate, authorize('school_admin', 'teacher'), CourseSessionController.completeSession);
router.put('/:id/sessions/:sessionNumber', authenticate, authorize('school_admin', 'teacher'), CourseSessionController.updateSession);
router.delete('/:id/sessions/:sessionNumber', authenticate, authorize('school_admin', 'teacher'), CourseSessionController.deleteSession);

export default router;