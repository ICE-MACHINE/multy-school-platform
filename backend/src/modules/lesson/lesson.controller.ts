import { Request, Response } from 'express';
import { lessonService } from './lesson.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { AuthUser } from '../../shared/interfaces';

export class LessonController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { courseId } = req.query;
    const result = await lessonService.getAll(schoolId, courseId as string);
    return ResponseHandler.success(res, result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await lessonService.getById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    const result = await lessonService.create(schoolId, req.body, user);
    return ResponseHandler.created(res, result, 'تم إنشاء الدرس');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    const result = await lessonService.update(req.params.id, schoolId, req.body, user);
    return ResponseHandler.success(res, result, 'تم تحديث الدرس');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const user = req.user as AuthUser;
    await lessonService.delete(req.params.id, schoolId, user);
    return ResponseHandler.success(res, null, 'تم حذف الدرس');
  });

  static getStudentProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const result = await lessonService.getStudentLessonProgress(studentId, schoolId);
    return ResponseHandler.success(res, result);
  });

  static updateStudentProgress = asyncHandler(async (req: Request, res: Response) => {
    const result = await lessonService.updateStudentProgress(req.body);
    return ResponseHandler.success(res, result, 'تم تحديث التقدم');
  });
}
