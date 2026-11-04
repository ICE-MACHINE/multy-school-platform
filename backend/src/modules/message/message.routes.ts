import { Router } from 'express';
import { MessageController } from './message.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/conversations', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.getConversations);
router.get('/conversations/:conversationId', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.getConversationMessages);
router.get('/recipients', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.getRecipients);
router.post('/group', authenticate, authorize('school_admin', 'teacher'), MessageController.sendGroup);
router.post('/', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.sendMessage);
router.get('/unread', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.getUnreadCount);
router.patch('/conversations/:conversationId/read', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.markAsRead);
router.delete('/:id', authenticate, authorize('school_admin', 'teacher', 'parent'), MessageController.deleteMessage);

export default router;