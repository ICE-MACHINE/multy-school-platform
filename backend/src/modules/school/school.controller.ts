import { Request, Response } from 'express';
import { schoolService } from './school.service';
import { messageService } from '../message/message.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class SchoolController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search } = req.query;
    const result = await schoolService.getAll(Number(page), Number(limit), search as string);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolService.getById(req.params.id);
    return ResponseHandler.success(res, result);
  });

  static getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolService.getBySlug(req.params.slug);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolService.create(req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء المدرسة');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolService.update(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث المدرسة');
  });

  static freeze = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolService.update(req.params.id, { isFrozen: true } as any);
    return ResponseHandler.success(res, result, 'تم تجميد المدرسة');
  });

  static unfreeze = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolService.update(req.params.id, { isFrozen: false } as any);
    return ResponseHandler.success(res, result, 'تم إلغاء تجميد المدرسة');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await schoolService.delete(req.params.id);
    return ResponseHandler.success(res, null, 'تم تعطيل المدرسة');
  });

  static clearMessages = asyncHandler(async (req: Request, res: Response) => {
    const school = await schoolService.getById(req.params.id);
    const count = Number(req.query.count ?? req.body.count ?? 0);
    const result = await messageService.deleteOldest(school.id, count);
    return ResponseHandler.success(res, result, 'تم حذف الرسائل القديمة');
  });
}
