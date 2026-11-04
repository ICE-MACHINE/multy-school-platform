import { Request, Response } from 'express';
import { messageService } from './message.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class MessageController {
  static getConversations = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await messageService.getConversationList(schoolId, req.user!.id, req.user!.role);
    return ResponseHandler.success(res, result);
  });

  static getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
    const result = await messageService.getConversationMessages(req.params.conversationId, req.user!.id, req.user!.role);
    return ResponseHandler.success(res, result);
  });

  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await messageService.sendMessage(schoolId, req.body, req.user!.id, req.user!.role);
    return ResponseHandler.created(res, result, 'تم إرسال الرسالة');
  });

  static sendGroup = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await messageService.sendGroup(schoolId, req.body, req.user!.id, req.user!.role);
    return ResponseHandler.created(res, result, 'تم إرسال الرسائل الجماعية');
  });

  static getRecipients = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await messageService.getRecipients(schoolId, req.user!.id, req.user!.role);
    return ResponseHandler.success(res, result);
  });

  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await messageService.getUnreadCount(schoolId, req.user!.id);
    return ResponseHandler.success(res, result);
  });

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    await messageService.markAsRead(req.params.conversationId, req.user!.id);
    return ResponseHandler.success(res, null, 'تم وضع علامة مقروء على الرسائل');
  });

  static deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    await messageService.deleteMessage(req.params.id, req.user!.id);
    return ResponseHandler.success(res, null, 'تم حذف الرسالة');
  });
}
