import { Router } from 'express';
import { TimetableController } from './timetable.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

// Settings - readable by all school roles, writable by admin only
router.get('/settings', authenticate, authorize('school_admin', 'teacher', 'parent'), TimetableController.getSettings);
router.put('/settings', authenticate, authorize('school_admin'), TimetableController.updateSettings);

// Slots - admin
router.get('/slots', authenticate, authorize('school_admin'), TimetableController.getSlots);
router.post('/slots', authenticate, authorize('school_admin'), TimetableController.createSlot);
router.put('/slots/:slotId', authenticate, authorize('school_admin'), TimetableController.updateSlot);
router.delete('/slots/:slotId', authenticate, authorize('school_admin'), TimetableController.deleteSlot);
router.patch('/slots/:slotId/move', authenticate, authorize('school_admin'), TimetableController.moveSlot);

// Slots - teacher (read-only + move request)
router.get('/slots/mine', authenticate, authorize('teacher'), TimetableController.getMySlots);

// Slots - parent
router.get('/slots/child/:studentId', authenticate, authorize('parent'), TimetableController.getChildSlots);

// Change requests
router.get('/requests', authenticate, authorize('school_admin', 'teacher'), TimetableController.getChangeRequests);
router.post('/requests', authenticate, authorize('teacher'), TimetableController.createChangeRequest);
router.patch('/requests/:requestId', authenticate, authorize('school_admin'), TimetableController.handleRequest);
router.delete('/requests/cleanup', authenticate, authorize('school_admin'), TimetableController.cleanupOldRequests);

export default router;
