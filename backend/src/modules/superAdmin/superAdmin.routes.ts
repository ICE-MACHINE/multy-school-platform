import { Router } from 'express';
import { SuperAdminController } from './superAdmin.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router({ mergeParams: true });

router.post('/login', authLimiter, SuperAdminController.login);
router.post('/refresh-token', authenticate, SuperAdminController.refreshToken);
router.get('/stats', authenticate, authorize('super_admin'), SuperAdminController.getStats);

router.get('/schools', authenticate, authorize('super_admin'), SuperAdminController.getAllSchools);
router.post('/schools', authenticate, authorize('super_admin'), SuperAdminController.createSchool);
router.get('/schools/:id', authenticate, authorize('super_admin'), SuperAdminController.getSchoolById);
router.put('/schools/:id', authenticate, authorize('super_admin'), SuperAdminController.updateSchool);
router.patch('/schools/:id/freeze', authenticate, authorize('super_admin'), SuperAdminController.freezeSchool);
router.patch('/schools/:id/unfreeze', authenticate, authorize('super_admin'), SuperAdminController.unfreezeSchool);
router.delete('/schools/:id', authenticate, authorize('super_admin'), SuperAdminController.deleteSchool);
router.get('/schools/:id/admin', authenticate, authorize('super_admin'), SuperAdminController.getSchoolAdmin);

export default router;