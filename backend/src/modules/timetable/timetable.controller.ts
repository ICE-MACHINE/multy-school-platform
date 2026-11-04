import { Request, Response } from 'express';
import { timetableService } from './timetable.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { asyncHandler } from '../../shared/middleware/asyncHandler';


function getSchoolId(req: Request): string {
  return (req as any).resolvedSchoolId || req.params.schoolId;
}

export class TimetableController {
  static getSettings = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.getSettings(schoolId);
    return ResponseHandler.success(res, result);
  });

  static updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.updateSettings(schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث الإعدادات');
  });

  static getSlots = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { day } = req.query;
    const result = await timetableService.getSlots(schoolId, day as string | undefined);
    return ResponseHandler.success(res, result);
  });

  static getMySlots = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.getMySlots(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getChildSlots = asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const schoolId = getSchoolId(req);
    const result = await timetableService.getChildSlots(schoolId, studentId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static createSlot = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.createSlot(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إضافة الخانة');
  });

  static updateSlot = asyncHandler(async (req: Request, res: Response) => {
    const { slotId } = req.params;
    const schoolId = getSchoolId(req);
    const result = await timetableService.updateSlot(slotId, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث الخانة');
  });

  static deleteSlot = asyncHandler(async (req: Request, res: Response) => {
    const { slotId } = req.params;
    const schoolId = getSchoolId(req);
    await timetableService.deleteSlot(slotId, schoolId);
    return ResponseHandler.success(res, null, 'تم حذف الخانة');
  });

  static moveSlot = asyncHandler(async (req: Request, res: Response) => {
    const { slotId } = req.params;
    const schoolId = getSchoolId(req);
    const result = await timetableService.moveSlot(slotId, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم نقل الخانة');
  });

  static getChangeRequests = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.getChangeRequests(schoolId);
    return ResponseHandler.success(res, result);
  });

  static createChangeRequest = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.createChangeRequest(schoolId, req.user!.id, req.body);
    return ResponseHandler.created(res, result, 'تم إرسال الطلب');
  });

  static handleRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const schoolId = getSchoolId(req);
    const result = await timetableService.handleRequest(requestId, schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم معالجة الطلب');
  });

  static cleanupOldRequests = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await timetableService.cleanupOldRequests(schoolId);
    return ResponseHandler.success(res, result);
  });
}
