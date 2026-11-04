import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin', 'teacher', 'parent'), NotificationController.getAll);
router.patch('/:id/read', authenticate, authorize('school_admin', 'teacher', 'parent'), NotificationController.markAsRead);
router.patch('/read-all', authenticate, authorize('school_admin', 'teacher', 'parent'), NotificationController.markAllAsRead);
router.delete('/:id', authenticate, authorize('school_admin', 'teacher', 'parent'), NotificationController.delete);
router.get('/unread', authenticate, authorize('school_admin', 'teacher', 'parent'), NotificationController.getUnreadCount);

export default router;