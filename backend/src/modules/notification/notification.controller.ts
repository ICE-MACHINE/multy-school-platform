import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class NotificationController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getAll(schoolId, req.user!.id, Number(page), Number(limit));
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAsRead(req.params.id, req.user!.id, getSchoolId(req));
    return ResponseHandler.success(res, null, 'تم وضع علامة مقروء للإشعار');
  });

  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await notificationService.markAllAsRead(req.user!.id, schoolId);
    return ResponseHandler.success(res, null, 'تم وضع علامة مقروء على جميع الإشعارات');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.delete(req.params.id, req.user!.id, getSchoolId(req));
    return ResponseHandler.success(res, null, 'تم حذف الإشعار');
  });

  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await notificationService.getUnreadCount(req.user!.id, schoolId);
    return ResponseHandler.success(res, result);
  });
}
