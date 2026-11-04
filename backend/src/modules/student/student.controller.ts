import { Request, Response } from 'express';
import { studentService } from './student.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { assertParentOwnsStudent } from '../../shared/tenant/tenantScope';

async function assertParentAccess(req: Request, schoolId: string): Promise<void> {
  if (req.user?.role !== 'parent') return;
  const student = await studentService.getById(req.params.id, schoolId);
  assertParentOwnsStudent(student.parentId, {
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId,
  });
}

export class StudentController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, search, classroomId } = req.query;
    const result = await studentService.getAll(
      schoolId, Number(page), Number(limit), search as string, classroomId as string
    );
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await assertParentAccess(req, schoolId);
    const result = await studentService.getById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await studentService.create(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء التلميذ');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await studentService.update(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث التلميذ');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await studentService.delete(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم تعطيل التلميذ');
  });

  static toggleExemption = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await studentService.toggleExemption(req.params.id, schoolId);
    return ResponseHandler.success(res, result.student, result.message);
  });

  static enrollInCourse = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await studentService.enrollInCourse(req.params.id, req.body.courseId, schoolId);
    return ResponseHandler.success(res, result, 'تم التسجيل في المادة');
  });

  static unenrollFromCourse = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await studentService.unenrollFromCourse(req.params.id, req.params.courseId, schoolId);
    return ResponseHandler.success(res, result, 'تم إلغاء التسجيل من المادة');
  });

  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await assertParentAccess(req, schoolId);
    const result = await studentService.getStudentStats(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getCourseProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await assertParentAccess(req, schoolId);
    const result = await studentService.getCourseProgress(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });
}
