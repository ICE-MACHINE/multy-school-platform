import { Router } from 'express';
import { StatsController } from './stats.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/super-admin', authenticate, authorize('super_admin'), StatsController.getSuperAdminStats);
router.get('/', authenticate, authorize('school_admin'), StatsController.getSchoolAdminStats);
router.get('/school-admin', authenticate, authorize('school_admin'), StatsController.getSchoolAdminStats);
router.get('/teacher', authenticate, authorize('teacher'), StatsController.getTeacherStats);

export default router;