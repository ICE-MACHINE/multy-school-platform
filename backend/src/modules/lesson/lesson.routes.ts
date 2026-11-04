import { Router } from 'express';
import { LessonController } from './lesson.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin', 'teacher'), LessonController.getAll);
router.get('/:id', authenticate, authorize('school_admin', 'teacher'), LessonController.getById);
router.post('/', authenticate, authorize('school_admin', 'teacher'), LessonController.create);
router.put('/:id', authenticate, authorize('school_admin', 'teacher'), LessonController.update);
router.delete('/:id', authenticate, authorize('school_admin', 'teacher'), LessonController.delete);
router.get('/student/:studentId/progress', authenticate, authorize('school_admin', 'teacher', 'parent'), LessonController.getStudentProgress);
router.post('/progress', authenticate, authorize('school_admin', 'teacher'), LessonController.updateStudentProgress);

export default router;