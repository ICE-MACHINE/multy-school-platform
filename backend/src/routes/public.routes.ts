import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { StatsController } from '../modules/stats/stats.controller';
import { schoolService } from '../modules/school/school.service';
import { ResponseHandler } from '../shared/utils/ResponseHandler';
import { asyncHandler } from '../shared/middleware/asyncHandler';

const router = Router();

const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
  },
});

function toPublicSchool(school: any) {
  return {
    id: school.id,
    slug: school.slug,
    name: school.name,
    type: school.type,
    phone: school.phone,
    address: school.address,
    studentCount: school.studentCount,
    monthlyFee: school.monthlyFee,
    currentUsers: school.currentUsers,
    maxUsers: school.maxUsers,
    currentMessages: school.currentMessages,
    maxMessages: school.maxMessages,
  };
}

router.use(publicLimiter);

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/platform-stats', StatsController.getPublicPlatformStats);

router.get('/schools/:slug', asyncHandler(async (req: Request, res: Response) => {
  const school = await schoolService.getBySlug(req.params.slug);
  if (school.isFrozen || !school.isActive) {
    return ResponseHandler.error(res, 'School not found', 404);
  }
  return ResponseHandler.success(res, toPublicSchool(school));
}));

router.get('/schools/:slug/stats', StatsController.getPublicSchoolStats);

export default router;
