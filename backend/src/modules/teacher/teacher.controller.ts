import { Request, Response } from 'express';
import { teacherService } from './teacher.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { sendAuthResult } from '../../shared/auth/authCookies';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class TeacherController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    const schoolId = getSchoolId(req);
    const result = await teacherService.login({ phone, password, schoolId });
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تسجيل الدخول بنجاح');
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.refreshToken(req.user!.id, schoolId);
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تحديث الرمز');
  });

  static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.getDashboardStats(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getAssignedClassroom = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.getAssignedClassroom(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getStudents = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.getStudents(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getStudentById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.getStudentById(schoolId, req.user!.id, req.params.studentId);
    return ResponseHandler.success(res, result);
  });

  static recordAttendance = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.recordAttendance(schoolId, req.user!.id, req.body);
    return ResponseHandler.created(res, result, 'تم تسجيل الحضور');
  });

  static bulkRecordAttendance = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.bulkRecordAttendance(schoolId, req.user!.id, req.body);
    return ResponseHandler.created(res, result, 'تم تسجيل الحضور');
  });

  static updateQuranProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.updateQuranProgress(schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث التقدم');
  });

  static updateLessonProgress = asyncHandler(async (req: Request, res: Response) => {
    const result = await teacherService.updateLessonProgress(getSchoolId(req), req.body);
    return ResponseHandler.success(res, result, 'تم تحديث التقدم');
  });

  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await teacherService.sendMessage(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إرسال الرسالة');
  });
}
