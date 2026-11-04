import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class AttendanceController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, date, from, to, period, studentId, isAbsent, justified, search } = req.query;
    const result = await attendanceService.getAll(schoolId, Number(page), Number(limit), {
      date: date as string,
      from: from as string,
      to: to as string,
      period: period as string,
      studentId: studentId as string,
      isAbsent: isAbsent as string,
      justified: justified as string,
      search: search as string,
    });
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getSummary = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { date, from, to, period, studentId, isAbsent } = req.query;
    const result = await attendanceService.getSummary(schoolId, {
      date: date as string,
      from: from as string,
      to: to as string,
      period: period as string,
      studentId: studentId as string,
      isAbsent: isAbsent as string,
    });
    return ResponseHandler.success(res, result, 'ملخص الحضور');
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await attendanceService.create(schoolId, req.body);
    return ResponseHandler.created(res, result, 'Attendance recorded');
  });

  static bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await attendanceService.bulkCreate(schoolId, req.body.records);
    return ResponseHandler.created(res, result, 'Attendance recorded');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await attendanceService.update(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث الحضور');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await attendanceService.delete(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف الحضور');
  });

  static justify = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await attendanceService.justify(req.params.id, schoolId, req.body.justification);
    return ResponseHandler.success(res, result, 'تم تبرير الغياب');
  });

  static getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const { month } = req.query;
    const result = await attendanceService.getStudentAttendance(studentId, schoolId, month as string);
    return ResponseHandler.success(res, result);
  });

  static getAbsenceCounts = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { month } = req.query;
    const result = await attendanceService.getAbsenceCounts(schoolId, month as string);
    return ResponseHandler.success(res, result);
  });

  static getMonthlyStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { month } = req.query;
    const result = await attendanceService.getMonthlyStats(schoolId, month as string);
    return ResponseHandler.success(res, result);
  });
}
