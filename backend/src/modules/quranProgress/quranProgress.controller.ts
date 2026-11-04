import { Request, Response } from 'express';
import { quranProgressService } from './quranProgress.service';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export class QuranProgressController {
  static initializeStudentProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { studentId } = req.body;
    const result = await quranProgressService.initializeStudentProgress(studentId, schoolId);
    return ResponseHandler.created(res, result, 'تم تهيئة التقدم');
  });

  static getStudentProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const studentId = req.params.studentId;
    const { includeNotReached } = req.query;
    const result = await quranProgressService.getStudentProgress(
      studentId, schoolId, includeNotReached === 'true'
    );
    return ResponseHandler.success(res, result);
  });

  static updateProgress = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await quranProgressService.updateProgress(schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث التقدم');
  });

  static updateStudentSummary = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await quranProgressService.updateStudentSummary(schoolId, req.body);
    return ResponseHandler.success(res, result, 'تم تحديث الملخص');
  });

  static getSurahs = asyncHandler(async (_req: Request, res: Response) => {
    const result = await quranProgressService.getSurahs();
    return ResponseHandler.success(res, result);
  });

  static getSchoolStats = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await quranProgressService.getSchoolStats(schoolId);
    return ResponseHandler.success(res, result);
  });
}
