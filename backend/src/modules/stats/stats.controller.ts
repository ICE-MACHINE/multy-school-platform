import { Request, Response } from 'express';
import { statsService } from './stats.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { AppDataSource } from '../../config/data-source';
import { School } from '../school/school.entity';

export class StatsController {
  static getSuperAdminStats = asyncHandler(async (_req: Request, res: Response) => {
    const result = await statsService.getSuperAdminStats();
    return ResponseHandler.success(res, result);
  });

  static getSchoolAdminStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await statsService.getSchoolAdminStats(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getTeacherStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const teacherId = req.user!.id;
    const result = await statsService.getTeacherStats(schoolId, teacherId);
    return ResponseHandler.success(res, result);
  });

  static getPublicPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
    const result = await statsService.getPublicPlatformStats();
    return ResponseHandler.success(res, result);
  });

  static getPublicSchoolStats = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const school = await AppDataSource.getRepository(School).findOne({
      where: [{ slug }, { id: slug }],
      select: ['id', 'isActive', 'isFrozen'],
    });
    if (!school || school.isFrozen || !school.isActive) {
      return ResponseHandler.error(res, 'School not found', 404);
    }
    const result = await statsService.getPublicSchoolStats(school.id);
    if (!result) {
      return ResponseHandler.error(res, 'School not found', 404);
    }
    return ResponseHandler.success(res, result);
  });
}
