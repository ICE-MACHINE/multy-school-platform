import { Router } from 'express';
import { StudentController } from './student.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin', 'teacher'), StudentController.getAll);
router.get('/:id', authenticate, authorize('school_admin', 'teacher', 'parent'), StudentController.getById);
router.post('/', authenticate, authorize('school_admin'), StudentController.create);
router.put('/:id', authenticate, authorize('school_admin'), StudentController.update);
router.delete('/:id', authenticate, authorize('school_admin'), StudentController.delete);
router.patch('/:id/exemption', authenticate, authorize('school_admin'), StudentController.toggleExemption);
router.post('/:id/enroll', authenticate, authorize('school_admin'), StudentController.enrollInCourse);
router.delete('/:id/enroll/:courseId', authenticate, authorize('school_admin'), StudentController.unenrollFromCourse);
router.get('/:id/stats', authenticate, authorize('school_admin', 'teacher', 'parent'), StudentController.getStats);
router.get('/:id/course-progress', authenticate, authorize('school_admin', 'teacher', 'parent'), StudentController.getCourseProgress);

export default router;