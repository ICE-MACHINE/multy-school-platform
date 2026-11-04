import { Router } from 'express';
import { ClassroomController } from './classroom.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin', 'teacher'), ClassroomController.getAll);
router.get('/:id', authenticate, authorize('school_admin', 'teacher'), ClassroomController.getById);
router.post('/', authenticate, authorize('school_admin'), ClassroomController.create);
router.put('/:id', authenticate, authorize('school_admin'), ClassroomController.update);
router.delete('/:id', authenticate, authorize('school_admin'), ClassroomController.delete);
router.put('/:id/assign-teacher', authenticate, authorize('school_admin'), ClassroomController.assignTeacher);

export default router;