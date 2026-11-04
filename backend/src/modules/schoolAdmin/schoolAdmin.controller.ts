import { Request, Response } from 'express';
import { schoolAdminService } from './schoolAdmin.service';
import { schoolAdminTeachersService } from './schoolAdminTeachers.service';
import { schoolAdminParentsService } from './schoolAdminParents.service';
import { schoolAdminStudentsService } from './schoolAdminStudents.service';
import { schoolAdminClassroomsService } from './schoolAdminClassrooms.service';
import { schoolAdminCoursesService } from './schoolAdminCourses.service';
import { schoolAdminPaymentsService } from './schoolAdminPayments.service';
import { schoolAdminAttendanceService } from './schoolAdminAttendance.service';
import { schoolAdminMessagesService } from './schoolAdminMessages.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { sendAuthResult } from '../../shared/auth/authCookies';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

function getSchoolId(req: Request): string {
  return (req as any).resolvedSchoolId || req.params.schoolId;
}

export class SchoolAdminController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    const schoolId = getSchoolId(req);
    const result = await schoolAdminService.login({ phone, password, schoolId });
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تسجيل الدخول بنجاح');
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminService.refreshToken(req.user!.id, schoolId);
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تحديث الرمز');
  });

  static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminService.getDashboardStats(schoolId);
    return ResponseHandler.success(res, result);
  });

  static createAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await schoolAdminService.createAdmin(req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء المسؤول');
  });

  static getAllTeachers = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, search } = req.query;
    const result = await schoolAdminTeachersService.getAllTeachers(schoolId, Number(page), Number(limit), search as string);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getTeacherById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminTeachersService.getTeacherById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static createTeacher = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminTeachersService.createTeacher(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء المعلم');
  });

  static updateTeacher = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminTeachersService.updateTeacher(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث المعلم');
  });

  static deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await schoolAdminTeachersService.deleteTeacher(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم تعطيل المعلم');
  });

  static getAllParents = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, search } = req.query;
    const result = await schoolAdminParentsService.getAllParents(schoolId, Number(page), Number(limit), search as string);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getParentById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminParentsService.getParentById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static createParent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminParentsService.createParent(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء ولي الأمر');
  });

  static updateParent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminParentsService.updateParent(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث ولي الأمر');
  });

  static deleteParent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await schoolAdminParentsService.deleteParent(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف ولي الأمر');
  });

  static getParentDeletePreview = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminParentsService.getParentDeletePreview(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getAllStudents = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, search, gender, classroomId, courseId, paymentStatus } = req.query;
    const result = await schoolAdminStudentsService.getAllStudents(schoolId, Number(page), Number(limit), search as string, gender as string, classroomId as string, courseId as string, paymentStatus as string);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static getStudentById = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminStudentsService.getStudentById(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static createStudent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminStudentsService.createStudent(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء التلميذ');
  });

  static updateStudent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminStudentsService.updateStudent(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث التلميذ');
  });

  static deleteStudent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await schoolAdminStudentsService.deleteStudent(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم تعطيل التلميذ');
  });

  static getStudentDeletePreview = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminStudentsService.getStudentDeletePreview(req.params.id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getAllClassrooms = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminClassroomsService.getAllClassrooms(schoolId);
    return ResponseHandler.success(res, result);
  });

  static createClassroom = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminClassroomsService.createClassroom(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء القسم');
  });

  static updateClassroom = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminClassroomsService.updateClassroom(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث القسم');
  });

  static deleteClassroom = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await schoolAdminClassroomsService.deleteClassroom(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف القسم');
  });

  static getAllCourses = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminCoursesService.getAllCourses(schoolId);
    return ResponseHandler.success(res, result);
  });

  static createCourse = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminCoursesService.createCourse(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إنشاء المادة');
  });

  static updateCourse = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminCoursesService.updateCourse(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث المادة');
  });

  static deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await schoolAdminCoursesService.deleteCourse(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف المادة');
  });

  static getAllPayments = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20 } = req.query;
    const result = await schoolAdminPaymentsService.getAllPayments(schoolId, Number(page), Number(limit));
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  static createPayment = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminPaymentsService.createPayment(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم تسجيل الدفعة');
  });

  static getAttendanceByDate = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { date } = req.query;
    const result = await schoolAdminAttendanceService.getAttendanceByDate(schoolId, date as string);
    return ResponseHandler.success(res, result);
  });

  static justifyAbsence = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminAttendanceService.justifyAbsence(req.params.id, schoolId, req.body.justification);
    return ResponseHandler.success(res, result, 'تم تبرير الغياب');
  });

  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminMessagesService.sendMessage(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إرسال الرسالة');
  });

  static updateSchool = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await schoolAdminService.updateSchool(schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث إعدادات المدرسة');
  });
}
