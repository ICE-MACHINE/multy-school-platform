import { Request, Response } from 'express';
import { courseAttendanceService } from './courseAttendance.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class CourseAttendanceController {
  static getBySession = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.getBySession(
      req.params.id,
      Number(req.params.sessionNumber),
      schoolId,
      (req as any).user,
    );
    return ResponseHandler.success(res, result);
  });

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, date, from, to, period, month, studentId, isAbsent, justified, search } = req.query;
    const result = await courseAttendanceService.getAll(
      req.params.id,
      schoolId,
      (req as any).user,
      {
        date: date as string,
        from: from as string,
        to: to as string,
        period: period as string,
        month: month as string,
        studentId: studentId as string,
        isAbsent: isAbsent as string,
        justified: justified as string,
        search: search as string,
      },
      Number(page),
      Number(limit),
    );
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getSummary = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { date, from, to, period, month, studentId } = req.query;
    const result = await courseAttendanceService.getSummary(
      req.params.id,
      schoolId,
      (req as any).user,
      {
        date: date as string,
        from: from as string,
        to: to as string,
        period: period as string,
        month: month as string,
        studentId: studentId as string,
      },
    );
    return ResponseHandler.success(res, result, 'ملخص الحضور والغياب');
  });

  static upsert = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.upsert(req.params.id, schoolId, (req as any).user, req.body);
    return ResponseHandler.success(res, result, 'تم تسجيل الحضور');
  });

  static bulkUpsert = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.bulkUpsert(req.params.id, schoolId, (req as any).user, req.body);
    return ResponseHandler.success(res, result, 'تم تسجيل الحضور');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.update(req.params.attendanceId, schoolId, (req as any).user, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث الحضور');
  });

  static justify = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.justify(req.params.attendanceId, schoolId, (req as any).user, req.body.justification);
    return ResponseHandler.success(res, result, 'تم تبرير الغياب');
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.remove(req.params.attendanceId, schoolId, (req as any).user);
    return ResponseHandler.success(res, result, 'تم حذف سجل الحضور');
  });

  static getStudentCourseAttendance = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { month } = req.query;
    const result = await courseAttendanceService.getStudentCourseAttendance(
      req.params.studentId,
      schoolId,
      (req as any).user,
      month as string,
    );
    return ResponseHandler.success(res, result);
  });

  static getStudentCourseDetail = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseAttendanceService.getStudentCourseDetail(
      req.params.studentId,
      req.params.courseId,
      schoolId,
      (req as any).user,
    );
    return ResponseHandler.success(res, result);
  });
}
