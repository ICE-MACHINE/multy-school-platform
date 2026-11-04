import { Router } from 'express';
import { TeacherController } from './teacher.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router({ mergeParams: true });

router.post('/login', authLimiter, TeacherController.login);
router.post('/refresh-token', authenticate, TeacherController.refreshToken);

router.get('/dashboard', authenticate, authorize('teacher'), TeacherController.getDashboardStats);
router.get('/classroom', authenticate, authorize('teacher'), TeacherController.getAssignedClassroom);
router.get('/students', authenticate, authorize('teacher'), TeacherController.getStudents);
router.get('/students/:studentId', authenticate, authorize('teacher'), TeacherController.getStudentById);

router.post('/attendance', authenticate, authorize('teacher'), TeacherController.recordAttendance);
router.post('/attendance/bulk', authenticate, authorize('teacher'), TeacherController.bulkRecordAttendance);

router.post('/quran-progress', authenticate, authorize('teacher'), TeacherController.updateQuranProgress);
router.post('/lesson-progress', authenticate, authorize('teacher'), TeacherController.updateLessonProgress);

router.post('/messages', authenticate, authorize('teacher'), TeacherController.sendMessage);

export default router;