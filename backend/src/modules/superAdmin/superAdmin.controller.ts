import { Request, Response } from 'express';
import { superAdminService } from './superAdmin.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { sendAuthResult } from '../../shared/auth/authCookies';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class SuperAdminController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.login(req.body);
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تسجيل الدخول بنجاح');
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.refreshToken(req.user!.id);
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تحديث الرمز');
  });

  static createSchool = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.createSchool(req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء المدرسة');
  });

  static getAllSchools = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search } = req.query;
    const result = await superAdminService.getAllSchools(
      Number(page),
      Number(limit),
      search as string
    );
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getSchoolById = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.getSchoolById(req.params.id);
    return ResponseHandler.success(res, result);
  });

  static updateSchool = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.updateSchool(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث المدرسة');
  });

  static freezeSchool = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.freezeSchool(req.params.id);
    return ResponseHandler.success(res, result, 'تم تجميد المدرسة');
  });

  static unfreezeSchool = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.unfreezeSchool(req.params.id);
    return ResponseHandler.success(res, result, 'تم إلغاء تجميد المدرسة');
  });

  static deleteSchool = asyncHandler(async (req: Request, res: Response) => {
    await superAdminService.deleteSchool(req.params.id);
    return ResponseHandler.success(res, null, 'تم تعطيل المدرسة');
  });

  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const period = req.query.period as 'week' | 'month' | 'year' | undefined;
    const result = await superAdminService.getStats(period);
    return ResponseHandler.success(res, result);
  });

  static getSchoolAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await superAdminService.getSchoolAdmin(req.params.id);
    return ResponseHandler.success(res, result);
  });
}
