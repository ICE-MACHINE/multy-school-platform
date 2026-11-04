import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { SuperAdminAiController } from './superAdminAi.controller';
import { aiLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router();

router.get('/briefing', authenticate, authorize('super_admin'), SuperAdminAiController.getBriefing);
router.get('/insights', authenticate, authorize('super_admin'), SuperAdminAiController.getInsights);
router.get('/trends', authenticate, authorize('super_admin'), SuperAdminAiController.getTrends);
router.post('/chat', authenticate, authorize('super_admin'), aiLimiter, SuperAdminAiController.chat);

export default router;
