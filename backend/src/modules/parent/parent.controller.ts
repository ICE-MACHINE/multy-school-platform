import { Request, Response } from 'express';
import { parentService } from './parent.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { sendAuthResult } from '../../shared/auth/authCookies';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class ParentController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    const schoolId = getSchoolId(req);
    const result = await parentService.login({ phone, password, schoolId });
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تسجيل الدخول بنجاح');
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await parentService.refreshToken(req.user!.id, schoolId);
    return sendAuthResult(res, result as unknown as Record<string, unknown>, 'تم تحديث الرمز');
  });

  static getChildren = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await parentService.getChildren(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getChildProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const result = await parentService.getChildProgress(schoolId, req.user!.id, studentId);
    return ResponseHandler.success(res, result);
  });

  static getChildAttendance = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const { month } = req.query;
    const result = await parentService.getChildAttendance(schoolId, req.user!.id, studentId, month as string);
    return ResponseHandler.success(res, result);
  });

  static getPayments = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await parentService.getPayments(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await parentService.getNotifications(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await parentService.sendMessage(schoolId, req.body);
    return ResponseHandler.created(res, result, 'تم إرسال الرسالة');
  });

  static getConversations = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await parentService.getConversations(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
    const result = await parentService.getConversationMessages(req.params.conversationId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static markNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    await parentService.markNotificationsRead(schoolId, req.user!.id);
    return ResponseHandler.success(res, null, 'تم وضع علامة مقروء على جميع الإشعارات');
  });

  static markMessagesRead = asyncHandler(async (req: Request, res: Response) => {
    await parentService.markMessagesRead(req.params.conversationId, req.user!.id);
    return ResponseHandler.success(res, null, 'تم وضع علامة مقروء على الرسائل');
  });
}
