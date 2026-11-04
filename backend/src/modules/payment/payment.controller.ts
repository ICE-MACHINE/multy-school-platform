import { Request, Response } from 'express';
import { paymentService } from './payment.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class PaymentController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, studentId, month, search } = req.query;
    const result = await paymentService.getAll(schoolId, Number(page), Number(limit), studentId as string, month as string, search as string);
    return ResponseHandler.paginated(res, result.data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalAmount: result.totalAmount,
    });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await paymentService.create(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم تسجيل الدفعة');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await paymentService.update(req.params.id, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث الدفعة');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await paymentService.delete(req.params.id, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف الدفعة');
  });

  static getStudentPayments = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const result = await paymentService.getStudentPayments(studentId, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getStudentCoursePayments = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const result = await paymentService.getStudentCoursePayments(studentId, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getMonthlyStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { month } = req.query;
    const result = await paymentService.getMonthlyStats(schoolId, month as string);
    return ResponseHandler.success(res, result);
  });

  static checkRemainingMonths = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const result = await paymentService.checkRemainingMonths(studentId, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getReceipt = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const id = req.params.id;
    const result = await paymentService.getReceiptById(id, schoolId);
    return ResponseHandler.success(res, result);
  });

  static getAvailableMonths = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await paymentService.getAvailableMonths(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getForPrint = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const months = typeof req.query.months === 'string'
      ? req.query.months.split(',').map((m) => m.trim()).filter(Boolean)
      : [];
    const result = await paymentService.getForPrint(schoolId, months);
    return ResponseHandler.success(res, result);
  });
}
