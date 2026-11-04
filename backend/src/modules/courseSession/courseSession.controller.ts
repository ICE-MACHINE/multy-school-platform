import { Request, Response } from 'express';
import { courseSessionService } from './courseSession.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class CourseSessionController {
  static getSessions = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseSessionService.getSessions(req.params.id, schoolId, (req as any).user);
    return ResponseHandler.success(res, result);
  });

  static completeSession = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseSessionService.completeSession(req.params.id, schoolId, req.body, (req as any).user);
    return ResponseHandler.created(res, result, 'تم تسجيل إتمام الحصة');
  });

  static updateSession = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseSessionService.updateSession(
      req.params.id,
      schoolId,
      Number(req.params.sessionNumber),
      req.body,
      (req as any).user,
    );
    return ResponseHandler.success(res, result, 'تم تحديث الحصة');
  });

  static deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await courseSessionService.deleteSession(
      req.params.id,
      schoolId,
      Number(req.params.sessionNumber),
      (req as any).user,
    );
    return ResponseHandler.success(res, result, 'تم إلغاء إتمام الحصة');
  });
}
