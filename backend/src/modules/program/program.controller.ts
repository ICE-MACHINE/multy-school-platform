import { Request, Response } from 'express';
import { programService } from './program.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { AuthUser } from '../../shared/interfaces';

export class ProgramController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await programService.getAll(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await programService.getById(req.params.id);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    const result = await programService.create(schoolId, req.body, user);
    return ResponseHandler.created(res, result, 'تم إنشاء البرنامج');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    const result = await programService.update(req.params.id, schoolId, req.body, user);
    return ResponseHandler.success(res, result, 'تم تحديث البرنامج');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    await programService.delete(req.params.id, schoolId, user);
    return ResponseHandler.success(res, null, 'تم حذف البرنامج');
  });

  static createModule = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    const result = await programService.createModule(req.body, schoolId, user);
    return ResponseHandler.created(res, result, 'تم إنشاء الوحدة');
  });

  static updateModule = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    const result = await programService.updateModule(req.params.moduleId, schoolId, req.body, user);
    return ResponseHandler.success(res, result, 'تم تحديث الوحدة');
  });

  static deleteModule = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    await programService.deleteModule(req.params.moduleId, schoolId, user);
    return ResponseHandler.success(res, null, 'تم حذف الوحدة');
  });

  static getByCourse = asyncHandler(async (req: Request, res: Response) => {
    const result = await programService.getByCourse(req.params.courseId);
    return ResponseHandler.success(res, result);
  });
}
