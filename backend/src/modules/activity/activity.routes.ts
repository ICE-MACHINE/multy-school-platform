import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('teacher', 'school_admin'), ActivityController.getAll);
router.get('/student/:studentId', authenticate, authorize('teacher', 'parent', 'school_admin'), ActivityController.getStudentProgress);
router.get('/:id', authenticate, authorize('teacher', 'school_admin'), ActivityController.getById);
router.post('/', authenticate, authorize('teacher'), ActivityController.create);
router.put('/:id', authenticate, authorize('teacher'), ActivityController.update);
router.post('/:id/complete', authenticate, authorize('teacher'), ActivityController.complete);
router.delete('/:id', authenticate, authorize('teacher'), ActivityController.delete);
router.get('/:id/participations', authenticate, authorize('teacher', 'school_admin'), ActivityController.getParticipations);
router.post('/:id/participate', authenticate, authorize('teacher'), ActivityController.markParticipation);
router.post('/:id/participate/bulk', authenticate, authorize('teacher'), ActivityController.bulkMarkParticipation);

export default router;
