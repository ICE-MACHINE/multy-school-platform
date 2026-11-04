import { Request, Response } from 'express';
import { classroomService } from './classroom.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class ClassroomController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await classroomService.getAll(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await classroomService.getById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await classroomService.create(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء القسم');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await classroomService.update(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث القسم');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await classroomService.delete(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف القسم');
  });

  static assignTeacher = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await classroomService.assignTeacher(req.params.id, schoolId, req.body.teacherId);
    return ResponseHandler.success(res, result, 'تم تعيين المعلم');
  });
}
