import { Request, Response } from 'express';
import { AppDataSource } from '../../config/data-source';
import { Student } from '../student/student.entity';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { ApiError } from '../../shared/utils/ApiError';
import { getSchoolId } from '../../shared/utils/getSchoolId';
import { ResponseHandler } from '../../shared/utils/ResponseHandler';
import { AiRiskLevel } from './aiPrediction.entity';
import { DocumentType } from './documentScan.entity';
import { documentVisionService, type PublicDocumentScan } from './documentVision.service';
import { predictionService } from './prediction.service';
import { scheduleAutomationService } from './scheduleAutomation.service';
import { financialIntelligenceService } from './financialIntelligence.service';
import { curriculumIntelligenceService } from './curriculumIntelligence.service';
import { notificationIntelligenceService } from './notificationIntelligence.service';

const RISK_LEVELS: AiRiskLevel[] = ['low', 'medium', 'high', 'critical'];
const DOCUMENT_TYPES: DocumentType[] = [
  'absence_justification',
  'medical_certificate',
  'invoice',
  'other',
  'unknown',
];

function getLocale(req: Request): string {
  const bodyLocale: unknown = (req.body as Record<string, unknown> | undefined)?.locale;
  if (typeof bodyLocale === 'string' && bodyLocale.trim().length > 0) {
    return bodyLocale;
  }
  const header = req.headers['accept-language'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.split(',')[0].split(';')[0].trim();
  }
  return 'en';
}

async function assertParentOwnsStudent(
  req: Request,
  schoolId: string,
  studentId: string,
): Promise<void> {
  if (req.user?.role !== 'parent') return;
  const student = await AppDataSource.getRepository(Student).findOne({
    where: { id: studentId, schoolId },
  });
  if (!student) throw ApiError.notFound('Student not found');
  if (student.parentId !== req.user.id) {
    throw ApiError.forbidden('You do not have access to this student');
  }
}

async function assertParentCanAccessDocument(
  req: Request,
  schoolId: string,
  scan: Pick<PublicDocumentScan, 'studentId'>,
): Promise<void> {
  if (req.user?.role !== 'parent') return;
  if (!scan.studentId) {
    throw ApiError.forbidden('You do not have access to this document');
  }
  await assertParentOwnsStudent(req, schoolId, scan.studentId);
}

export class AiController {
  static runPredictions = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await predictionService.predictForSchool(schoolId, getLocale(req));
    return ResponseHandler.success(res, result);
  });

  static predictStudent = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { studentId } = req.params;
    await assertParentOwnsStudent(req, schoolId, studentId);
    const result = await predictionService.predictForStudent(
      schoolId,
      studentId,
      getLocale(req),
    );
    return ResponseHandler.success(res, result);
  });

  static getLatestPrediction = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { studentId } = req.params;
    await assertParentOwnsStudent(req, schoolId, studentId);
    const result = await predictionService.getLatest(schoolId, studentId);
    return ResponseHandler.success(res, result);
  });

  static listPredictions = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const riskQuery = typeof req.query.riskLevel === 'string' ? req.query.riskLevel : undefined;
    const riskLevel =
      riskQuery && (RISK_LEVELS as string[]).includes(riskQuery)
        ? (riskQuery as AiRiskLevel)
        : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
    const result = await predictionService.list(schoolId, {
      riskLevel,
      limit: Number.isFinite(limitQuery) ? limitQuery : undefined,
    });
    return ResponseHandler.success(res, result);
  });

  static parentSummary = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { studentId } = req.params;
    await assertParentOwnsStudent(req, schoolId, studentId);
    const result = await predictionService.predictForStudent(
      schoolId,
      studentId,
      getLocale(req),
    );
    return ResponseHandler.success(res, result);
  });

  static evaluatePendingScheduleRequests = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await scheduleAutomationService.evaluatePending(schoolId);
    return ResponseHandler.success(res, result);
  });

  static evaluateScheduleRequest = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { requestId } = req.params;
    const result = await scheduleAutomationService.evaluate(schoolId, requestId, {
      applyIfApproved: true,
    });
    return ResponseHandler.success(res, result);
  });

  static suggestScheduleAlternatives = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const { requestId } = req.params;
    const result = await scheduleAutomationService.suggestAlternatives(schoolId, requestId);
    return ResponseHandler.success(res, result);
  });

  static getFinancialIntelligence = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await financialIntelligenceService.getOverview(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getCurriculumIntelligence = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const yearEnd = typeof req.query.yearEnd === 'string' ? req.query.yearEnd : undefined;
    const result = await curriculumIntelligenceService.getOverview(schoolId, {
      teacherId: req.user?.role === 'teacher' ? req.user.id : undefined,
      academicYearEnd: yearEnd && /^\d{4}-\d{2}-\d{2}$/.test(yearEnd) ? yearEnd : undefined,
    });
    return ResponseHandler.success(res, result);
  });

  static getNotificationIntelligence = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await notificationIntelligenceService.getAdminOverview(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getNotificationDigest = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const periodRaw = typeof req.query.periodDays === 'string' ? parseInt(req.query.periodDays, 10) : NaN;
    const periodDays = Number.isFinite(periodRaw) ? Math.min(30, Math.max(1, periodRaw)) : 7;
    const [digest, grouped] = await Promise.all([
      notificationIntelligenceService.getDigest(schoolId, req.user!.id, periodDays),
      notificationIntelligenceService.getGrouped(schoolId, req.user!.id),
    ]);
    return ResponseHandler.success(res, { digest, ...grouped });
  });

  static listPendingReview = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await scheduleAutomationService.listPendingReview(schoolId);
    return ResponseHandler.success(res, result);
  });

  static scanDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    if (!req.file) throw ApiError.badRequest('File is required');

    const body = req.body as Record<string, unknown>;
    const studentId = typeof body.studentId === 'string' && body.studentId ? body.studentId : undefined;
    if (req.user?.role === 'parent' && !studentId) {
      throw ApiError.badRequest('Parents must link the document to their child (studentId is required)');
    }
    if (studentId) {
      await assertParentOwnsStudent(req, schoolId, studentId);
    }

    const documentType =
      typeof body.documentType === 'string' &&
      (DOCUMENT_TYPES as string[]).includes(body.documentType)
        ? (body.documentType as DocumentType)
        : undefined;

    const result = await documentVisionService.scanDocument(
      schoolId,
      req.user!.id,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      { studentId, documentType },
      req.user!.role,
    );
    return ResponseHandler.created(res, result);
  });

  static confirmDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const existing = await documentVisionService.getById(schoolId, req.params.id);
    await assertParentCanAccessDocument(req, schoolId, existing);
    const body = (req.body || {}) as Record<string, unknown>;
    const result = await documentVisionService.confirm(
      schoolId,
      req.params.id,
      { id: req.user!.id, role: req.user!.role },
      {
        extractedFields: body.extractedFields as Record<string, unknown> | undefined,
        documentType: body.documentType,
      },
    );
    return ResponseHandler.success(res, result);
  });

  static reviewDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const body = (req.body || {}) as Record<string, unknown>;
    const decision = body.decision;
    if (decision !== 'approved' && decision !== 'rejected') {
      throw ApiError.badRequest('decision must be "approved" or "rejected"');
    }
    const result = await documentVisionService.review(
      schoolId,
      req.params.id,
      { id: req.user!.id, role: req.user!.role },
      {
        decision,
        note: typeof body.note === 'string' ? body.note : undefined,
        startDate: typeof body.startDate === 'string' ? body.startDate : undefined,
        endDate: typeof body.endDate === 'string' ? body.endDate : undefined,
      },
    );
    return ResponseHandler.success(res, result);
  });

  static archiveDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await documentVisionService.archive(schoolId, req.params.id, {
      id: req.user!.id,
      role: req.user!.role,
    });
    return ResponseHandler.success(res, result);
  });

  static expireStaleDocuments = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const result = await documentVisionService.expireStale(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getDocumentHistory = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const existing = await documentVisionService.getById(schoolId, req.params.id);
    await assertParentCanAccessDocument(req, schoolId, existing);
    const result = await documentVisionService.getHistory(
      schoolId,
      req.params.id,
      req.user?.role === 'school_admin',
    );
    return ResponseHandler.success(res, result);
  });

  static listDocuments = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    if (req.user?.role === 'parent') {
      const children = await AppDataSource.getRepository(Student).find({
        where: { schoolId, parentId: req.user.id },
        select: ['id'],
      });
      const result = await documentVisionService.list(
        schoolId,
        children.map((child) => child.id),
      );
      return ResponseHandler.success(res, result);
    }
    const result = await documentVisionService.list(schoolId);
    return ResponseHandler.success(res, result);
  });

  static getDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const existing = await documentVisionService.getById(schoolId, req.params.id);
    await assertParentCanAccessDocument(req, schoolId, existing);
    const result = await documentVisionService.getById(schoolId, req.params.id, {
      id: req.user!.id,
      role: req.user!.role,
    });
    return ResponseHandler.success(res, result);
  });

  static previewDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    if (req.user?.role !== 'school_admin') {
      throw ApiError.forbidden('Only a school admin can open this document in the page');
    }
    const file = await documentVisionService.readForPreview(schoolId, req.params.id, {
      id: req.user!.id,
      role: req.user!.role,
    });
    const safeName = file.originalName.replace(/"/g, '').replace(/[\r\n]/g, '');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    );
    return res.send(file.buffer);
  });

  static downloadDocument = asyncHandler(async (req: Request, res: Response) => {
    const schoolId = getSchoolId(req);
    const scan = await documentVisionService.getById(schoolId, req.params.id);
    await assertParentCanAccessDocument(req, schoolId, scan);
    const file = await documentVisionService.readDecrypted(schoolId, req.params.id, {
      id: req.user!.id,
      role: req.user!.role,
    });
    const safeName = file.originalName.replace(/"/g, '').replace(/[\r\n]/g, '');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    );
    return res.send(file.buffer);
  });
}
