import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { AiController } from './ai.controller';
import { aiLimiter, uploadLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    // First gate only; the service re-sniffs magic bytes and never trusts this.
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

router.post(
  '/predictions/run',
  authenticate,
  authorize('school_admin', 'teacher'),
  aiLimiter,
  AiController.runPredictions,
);
router.post(
  '/predictions/student/:studentId',
  authenticate,
  authorize('school_admin', 'teacher', 'parent'),
  aiLimiter,
  AiController.predictStudent,
);
router.get(
  '/predictions/student/:studentId',
  authenticate,
  authorize('school_admin', 'teacher', 'parent'),
  AiController.getLatestPrediction,
);
router.get(
  '/predictions',
  authenticate,
  authorize('school_admin', 'teacher'),
  AiController.listPredictions,
);
router.post(
  '/parent-summary/:studentId',
  authenticate,
  authorize('parent', 'school_admin'),
  aiLimiter,
  AiController.parentSummary,
);
router.post(
  '/schedule-requests/evaluate-pending',
  authenticate,
  authorize('school_admin'),
  aiLimiter,
  AiController.evaluatePendingScheduleRequests,
);
router.post(
  '/schedule-requests/:requestId/evaluate',
  authenticate,
  authorize('school_admin'),
  aiLimiter,
  AiController.evaluateScheduleRequest,
);
router.get(
  '/schedule-requests/:requestId/alternatives',
  authenticate,
  authorize('school_admin'),
  AiController.suggestScheduleAlternatives,
);
router.get(
  '/finance',
  authenticate,
  authorize('school_admin'),
  AiController.getFinancialIntelligence,
);
router.get(
  '/curriculum',
  authenticate,
  authorize('school_admin', 'teacher'),
  AiController.getCurriculumIntelligence,
);
router.get(
  '/notifications/intelligence',
  authenticate,
  authorize('school_admin'),
  AiController.getNotificationIntelligence,
);
router.get(
  '/notifications/digest',
  authenticate,
  authorize('school_admin', 'teacher', 'parent'),
  AiController.getNotificationDigest,
);
router.get(
  '/schedule-requests/pending-review',
  authenticate,
  authorize('school_admin'),
  AiController.listPendingReview,
);
// Documents (medical/justification) are restricted to school_admin and the
// owning parent: teachers see the resulting justified flag in attendance,
// never the raw medical document or its decryption.
router.post(
  '/documents/scan',
  authenticate,
  authorize('school_admin', 'parent'),
  uploadLimiter,
  aiLimiter,
  upload.single('file'),
  AiController.scanDocument,
);
router.get(
  '/documents',
  authenticate,
  authorize('school_admin', 'parent'),
  AiController.listDocuments,
);
router.post(
  '/documents/expire-stale',
  authenticate,
  authorize('school_admin'),
  aiLimiter,
  AiController.expireStaleDocuments,
);
router.post(
  '/documents/:id/archive',
  authenticate,
  authorize('school_admin'),
  aiLimiter,
  AiController.archiveDocument,
);
router.get(
  '/documents/:id/history',
  authenticate,
  authorize('school_admin', 'parent'),
  AiController.getDocumentHistory,
);
router.post(
  '/documents/:id/confirm',
  authenticate,
  authorize('school_admin', 'parent'),
  aiLimiter,
  AiController.confirmDocument,
);
router.post(
  '/documents/:id/review',
  authenticate,
  authorize('school_admin'),
  aiLimiter,
  AiController.reviewDocument,
);
router.get(
  '/documents/:id/file',
  authenticate,
  authorize('school_admin', 'parent'),
  AiController.downloadDocument,
);
router.get(
  '/documents/:id/preview',
  authenticate,
  authorize('school_admin'),
  AiController.previewDocument,
);
router.get(
  '/documents/:id',
  authenticate,
  authorize('school_admin', 'parent'),
  AiController.getDocument,
);

export default router;
