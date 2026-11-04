import { Router } from 'express';
import { QuranProgressController } from './quranProgress.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';

const router = Router({ mergeParams: true });

router.get('/surahs', authenticate, QuranProgressController.getSurahs);
router.post('/initialize', authenticate, authorize('school_admin'), QuranProgressController.initializeStudentProgress);
router.get('/student/:studentId', authenticate, authorize('school_admin', 'teacher', 'parent'), QuranProgressController.getStudentProgress);
router.post('/update', authenticate, authorize('school_admin', 'teacher'), QuranProgressController.updateProgress);
router.post('/student-summary', authenticate, authorize('school_admin', 'teacher'), QuranProgressController.updateStudentSummary);
router.get('/stats', authenticate, authorize('school_admin'), QuranProgressController.getSchoolStats);

export default router;