import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize('school_admin'), PaymentController.getAll);
router.post('/', authenticate, authorize('school_admin'), PaymentController.create);
router.put('/:id', authenticate, authorize('school_admin'), PaymentController.update);
router.delete('/:id', authenticate, authorize('school_admin'), PaymentController.delete);
router.get('/student/:studentId', authenticate, authorize('school_admin', 'parent'), PaymentController.getStudentPayments);
router.get('/student/:studentId/courses', authenticate, authorize('school_admin'), PaymentController.getStudentCoursePayments);
router.get('/student/:studentId/remaining', authenticate, authorize('school_admin'), PaymentController.checkRemainingMonths);
router.get('/stats', authenticate, authorize('school_admin'), PaymentController.getMonthlyStats);
router.get('/print-months', authenticate, authorize('school_admin'), PaymentController.getAvailableMonths);
router.get('/print', authenticate, authorize('school_admin'), PaymentController.getForPrint);
router.get('/:id/receipt', authenticate, authorize('school_admin', 'parent'), PaymentController.getReceipt);

export default router;