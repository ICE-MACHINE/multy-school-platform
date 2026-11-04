import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin', 'teacher'), AttendanceController.getAll);
router.get('/summary', authenticate, authorize('school_admin', 'teacher'), AttendanceController.getSummary);
router.post('/', authenticate, authorize('school_admin', 'teacher'), AttendanceController.create);
router.post('/bulk', authenticate, authorize('school_admin', 'teacher'), AttendanceController.bulkCreate);
router.put('/:id', authenticate, authorize('school_admin', 'teacher'), AttendanceController.update);
router.patch('/:id/justify', authenticate, authorize('school_admin', 'teacher'), AttendanceController.justify);
router.delete('/:id', authenticate, authorize('school_admin', 'teacher'), AttendanceController.delete);
router.get('/absences/counts', authenticate, authorize('school_admin', 'teacher'), AttendanceController.getAbsenceCounts);
router.get('/student/:studentId', authenticate, authorize('school_admin', 'teacher', 'parent'), AttendanceController.getStudentAttendance);
router.get('/stats', authenticate, authorize('school_admin'), AttendanceController.getMonthlyStats);

export default router;