import { Router } from 'express';
import { ParentController } from './parent.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router({ mergeParams: true });

router.post('/login', authLimiter, ParentController.login);
router.post('/refresh-token', authenticate, ParentController.refreshToken);

router.get('/children', authenticate, authorize('parent'), ParentController.getChildren);
router.get('/children/:studentId/progress', authenticate, authorize('parent'), ParentController.getChildProgress);
router.get('/children/:studentId/attendance', authenticate, authorize('parent'), ParentController.getChildAttendance);
router.get('/payments', authenticate, authorize('parent'), ParentController.getPayments);

router.get('/notifications', authenticate, authorize('parent'), ParentController.getNotifications);
router.patch('/notifications/read', authenticate, authorize('parent'), ParentController.markNotificationsRead);

router.post('/messages', authenticate, authorize('parent'), ParentController.sendMessage);
router.get('/conversations', authenticate, authorize('parent'), ParentController.getConversations);
router.get('/conversations/:conversationId/messages', authenticate, authorize('parent'), ParentController.getConversationMessages);
router.patch('/conversations/:conversationId/read', authenticate, authorize('parent'), ParentController.markMessagesRead);

export default router;