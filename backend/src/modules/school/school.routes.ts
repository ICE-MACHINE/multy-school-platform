import { Router } from 'express';
import { SchoolController } from './school.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate, authorize('super_admin'));
router.get('/', SchoolController.getAll);
router.post('/', SchoolController.create);
router.get('/slug/:slug', SchoolController.getBySlug);
router.get('/:id', SchoolController.getById);
router.put('/:id', SchoolController.update);
router.patch('/:id/freeze', SchoolController.freeze);
router.patch('/:id/unfreeze', SchoolController.unfreeze);
router.delete('/:id/messages', SchoolController.clearMessages);
router.delete('/:id', SchoolController.delete);

export default router;