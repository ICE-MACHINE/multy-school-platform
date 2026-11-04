import { Request, Response } from 'express';
import { activityService } from './activity.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class ActivityController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, date, period } = req.query;
    const teacherId = req.user!.role === 'teacher' ? req.user!.id : undefined;
    const result = await activityService.getAll(schoolId, Number(page), Number(limit), date as string, period as string, teacherId);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const teacherId = req.user!.role === 'teacher' ? req.user!.id : undefined;
    const result = await activityService.getById(req.params.id, schoolId, teacherId);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await activityService.create(schoolId, req.user!.id, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء النشاط');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await activityService.update(req.params.id, schoolId, req.user!.id, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث النشاط');
  });

  static complete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await activityService.complete(req.params.id, schoolId, req.user!.id, req.body);
    return ResponseHandler.success(
      res,
      result,
      result.alreadyCompleted ? 'النشاط مكتمل مسبقاً' : 'تم إتمام النشاط وتحديث مشاركات التلاميذ'
    );
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await activityService.delete(req.params.id, schoolId, req.user!.id);
    return ResponseHandler.success(res, null, 'تم حذف النشاط');
  });

  static getStudentProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await activityService.getStudentProgress(
      schoolId,
      req.params.studentId,
      req.user!.id,
      req.user!.role
    );
    return ResponseHandler.success(res, result);
  });

  static getParticipations = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const teacherId = req.user!.role === 'teacher' ? req.user!.id : undefined;
    const result = await activityService.getParticipations(req.params.id, schoolId, teacherId);
    return ResponseHandler.success(res, result);
  });

  static markParticipation = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const teacherId = req.user!.role === 'teacher' ? req.user!.id : undefined;
    const { studentId } = req.body;
    const result = await activityService.markParticipation(req.params.id, schoolId, studentId, req.body, teacherId);
    return ResponseHandler.success(res, result, 'تم تسجيل المشاركة');
  });

  static bulkMarkParticipation = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const teacherId = req.user!.role === 'teacher' ? req.user!.id : undefined;
    const { records } = req.body;
    const result = await activityService.bulkMarkParticipation(req.params.id, schoolId, records, teacherId);
    return ResponseHandler.success(res, result, 'تم تسجيل المشاركات');
  });
}
