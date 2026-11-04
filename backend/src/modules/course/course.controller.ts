import { Request, Response } from 'express';
import { courseService } from './course.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class CourseController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, search } = req.query;
    const result = await courseService.getAll(schoolId, Number(page), Number(limit), search as string);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseService.getById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseService.create(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء المادة');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseService.update(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث المادة');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await courseService.delete(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف المادة');
  });

  static getEnrolledStudents = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseService.getEnrolledStudents(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static enrollStudent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseService.enrollStudent(req.params.id, schoolId, req.body.studentId);
    return ResponseHandler.success(res, result, 'تم تسجيل التلميذ');
  });

  static unenrollStudent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const refund = req.query.refund === 'true';
    const result = await courseService.unenrollStudent(req.params.id, schoolId, req.params.studentId, refund);
    return ResponseHandler.success(res, result, 'تم إلغاء تسجيل التلميذ');
  });

  static getUnenrollPreview = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseService.getUnenrollPreview(req.params.id, schoolId, req.params.studentId);
    return ResponseHandler.success(res, result);
  });
}
