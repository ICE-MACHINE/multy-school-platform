import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Between, In, Not, IsNull, type EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { env } from '../../config/env';
import { Attendance } from '../attendance/attendance.entity';
import { CourseAttendance } from '../courseAttendance/courseAttendance.entity';
import { Notification } from '../notification/notification.entity';
import { Student } from '../student/student.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { decryptBuffer, encryptBuffer } from './documentCrypto';
import { DocumentAccessLog, type DocumentAccessAction } from './documentAccessLog.entity';
import {
  DocumentScan,
  DocumentType,
  ExtractedDocumentFields,
  type DocumentVerification,
} from './documentScan.entity';
import { DocumentRevision, type DocumentRevisionAction, type DocumentFieldChange } from './documentRevision.entity';
import {
  canTransition,
  computeReviewExpiry,
  findOverlappingCoverage,
  isActionableLifecycleStatus,
  shouldExpire,
} from './documentLifecycle';
import {
  computeContentHash,
  sanitizeOriginalName,
  validateDocumentBuffer,
} from './documentFileValidation';
import { chatVisionJson, isMetaAiEnabled } from './metaAi.client';

export interface UploadedDocumentFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ScanDocumentOptions {
  studentId?: string;
  documentType?: DocumentType;
}

export interface DocumentActor {
  id: string;
  role: string;
}

export type PublicDocumentScan = Omit<DocumentScan, 'encryptedPath' | 'contentHash'>;

export type PublicDocumentRevision = Omit<DocumentRevision, 'actorId'> & { actorId?: string };

interface VisionExtractionResponse {
  documentType?: unknown;
  title?: unknown;
  studentName?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  dateOfBirth?: unknown;
  ageYears?: unknown;
  issueDate?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  reason?: unknown;
  issuer?: unknown;
  summary?: unknown;
  confidence?: unknown;
  extractedText?: unknown;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'absence_justification',
  'medical_certificate',
  'invoice',
  'other',
  'unknown',
];
const FIELD_KEYS: Array<keyof ExtractedDocumentFields> = [
  'title',
  'studentName',
  'firstName',
  'lastName',
  'dateOfBirth',
  'ageYears',
  'issueDate',
  'startDate',
  'endDate',
  'reason',
  'issuer',
  'summary',
];

const DATE_FIELD_KEYS = new Set<keyof ExtractedDocumentFields>([
  'dateOfBirth',
  'issueDate',
  'startDate',
  'endDate',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && (DOCUMENT_TYPES as string[]).includes(value);
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value > 1 && value <= 100) return Math.round((value / 100) * 10000) / 10000;
  return Math.min(1, Math.max(0, value));
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(documentName: string, studentName: string): boolean {
  const doc = normalizeName(documentName);
  const student = normalizeName(studentName);
  if (!doc || !student) return false;
  if (doc === student) return true;
  const docTokens = doc.split(' ').sort();
  const studentTokens = student.split(' ').sort();
  return (
    docTokens.length === studentTokens.length &&
    docTokens.every((token, index) => token === studentTokens[index])
  );
}

export function parseAgeYears(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const age = Math.floor(value);
    return age >= 0 && age <= 120 ? age : null;
  }
  if (typeof value !== 'string') return null;
  const match = value.match(/\d{1,3}/);
  if (!match) return null;
  const age = parseInt(match[0], 10);
  return age >= 0 && age <= 120 ? age : null;
}

export function ageInYearsAt(dateOfBirth: string, at: Date): number | null {
  if (!isValidDateString(dateOfBirth)) return null;
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  let age = at.getUTCFullYear() - y;
  const monthDiff = at.getUTCMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && at.getUTCDate() < d)) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export interface VerificationStudent {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
}

export function buildVerification(input: {
  studentFullName?: string | null;
  student?: VerificationStudent | null;
  fields: ExtractedDocumentFields | null;
  confidence: number | null;
  extractionSkipped: boolean;
  referenceDate?: Date;
}): DocumentVerification {
  const checks: string[] = ['awaiting_human_review'];
  const fields = input.fields;
  const legacyStudent = ((): VerificationStudent | null => {
    if (!input.studentFullName) return null;
    const parts = input.studentFullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || parts[0] || '',
      dateOfBirth: null,
    };
  })();
  const student = input.student ?? legacyStudent;
  const studentFullName =
    input.studentFullName || (student ? `${student.firstName} ${student.lastName}` : null);

  const docFirstName = fields?.firstName;
  const docLastName = fields?.lastName;
  const docFullName =
    fields?.studentName ||
    [docFirstName, docLastName].filter(Boolean).join(' ') ||
    undefined;

  let firstNameMatches: boolean | null = null;
  let lastNameMatches: boolean | null = null;
  let studentNameMatches: boolean | null = null;
  if (student) {
    if (docFirstName) {
      firstNameMatches = namesMatch(docFirstName, student.firstName);
      if (!firstNameMatches) checks.push('first_name_mismatch');
    }
    if (docLastName) {
      lastNameMatches = namesMatch(docLastName, student.lastName);
      if (!lastNameMatches) checks.push('last_name_mismatch');
    }
    if (firstNameMatches !== null || lastNameMatches !== null) {
      studentNameMatches =
        (firstNameMatches ?? true) && (lastNameMatches ?? true);
    } else if (docFullName && studentFullName) {
      studentNameMatches = namesMatch(docFullName, studentFullName);
    }
    if (studentNameMatches === false) checks.push('student_name_mismatch');
    if (studentNameMatches === null) checks.push('student_name_missing');
  }

  const referenceDate = (() => {
    if (isValidDateString(fields?.issueDate)) {
      const [y, m, d] = (fields.issueDate as string).split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    return input.referenceDate || new Date();
  })();

  const studentDob = student?.dateOfBirth || undefined;
  const documentAgeYears = fields?.dateOfBirth
    ? ageInYearsAt(fields.dateOfBirth, referenceDate)
    : null;
  const studentAgeYears = studentDob ? ageInYearsAt(studentDob, referenceDate) : null;

  let dateOfBirthMatches: boolean | null = null;
  if (student) {
    if (fields?.dateOfBirth) {
      if (!isValidDateString(fields.dateOfBirth)) {
        checks.push('date_of_birth_invalid');
      } else if (!studentDob || !isValidDateString(studentDob)) {
        checks.push('student_date_of_birth_missing');
      } else {
        dateOfBirthMatches = fields.dateOfBirth === studentDob;
        if (!dateOfBirthMatches) checks.push('date_of_birth_mismatch');
      }
    } else {
      checks.push('date_of_birth_missing');
    }
  }

  const statedAge = parseAgeYears(fields?.ageYears);
  let ageMatches: boolean | null = null;
  if (student) {
    if (statedAge !== null && studentAgeYears !== null) {
      ageMatches = statedAge === studentAgeYears;
    } else if (statedAge !== null && documentAgeYears !== null) {
      ageMatches = statedAge === documentAgeYears;
    } else if (documentAgeYears !== null && studentAgeYears !== null) {
      ageMatches = documentAgeYears === studentAgeYears;
    }
    if (ageMatches === false) checks.push('age_mismatch');
  }

  const issueDateValid = isValidDateString(fields?.issueDate);
  if (!issueDateValid) checks.push('issue_date_missing_or_invalid');

  const startOk = isValidDateString(fields?.startDate);
  const endOk = !fields?.endDate || isValidDateString(fields.endDate);
  const rangeOk =
    startOk && (!fields?.endDate || !isValidDateString(fields.endDate) || fields.endDate >= (fields.startDate as string));
  const datesValid = startOk && endOk && rangeOk;
  if (!datesValid) checks.push('dates_missing_or_invalid');
  const lowConfidence = input.confidence !== null && input.confidence < 0.7;
  if (lowConfidence) checks.push('low_confidence');
  if (input.extractionSkipped) checks.push('extraction_skipped_requires_manual_entry');
  return {
    requiresHumanReview: true,
    studentNameMatches,
    firstNameMatches,
    lastNameMatches,
    dateOfBirthMatches,
    ageMatches,
    documentAgeYears,
    studentAgeYears,
    issueDateValid,
    datesValid,
    lowConfidence,
    extractionSkipped: input.extractionSkipped,
    checks,
  };
}

function toPublic(scan: DocumentScan): PublicDocumentScan {
  const { encryptedPath: _encryptedPath, contentHash: _contentHash, ...rest } = scan;
  return rest;
}

export class DocumentVisionService {
  constructor(
    private readonly scanRepo = AppDataSource.getRepository(DocumentScan),
    private readonly studentRepo = AppDataSource.getRepository(Student),
    private readonly accessLogRepo = AppDataSource.getRepository(DocumentAccessLog),
    private readonly revisionRepo = AppDataSource.getRepository(DocumentRevision),
  ) {}

  private uploadDir(): string {
    return path.join(__dirname, '../../../uploads/ai-documents');
  }

  private async logAccess(
    schoolId: string,
    documentId: string,
    actor: DocumentActor,
    action: DocumentAccessAction,
  ): Promise<void> {
    try {
      await this.accessLogRepo.save(
        this.accessLogRepo.create({
          schoolId,
          documentId,
          actorId: actor.id,
          actorRole: actor.role,
          action,
        }),
      );
    } catch {
      // Audit logging must never break the primary operation; failures are visible as missing rows.
    }
  }

  private async recordRevision(
    schoolId: string,
    documentId: string,
    actor: DocumentActor,
    action: DocumentRevisionAction,
    fromStatus: string | null,
    toStatus: string | null,
    changes?: Record<string, DocumentFieldChange> | null,
    note?: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    try {
      const repo = manager ? manager.getRepository(DocumentRevision) : this.revisionRepo;
      await repo.save(
        repo.create({
          schoolId,
          documentId,
          actorId: actor.id,
          actorRole: actor.role,
          action,
          fromStatus,
          toStatus,
          changes: changes || null,
          note: note || null,
        }),
      );
    } catch {
      // Revision logging must never break the primary operation.
    }
  }

  private async applyLazyExpiry(scan: DocumentScan): Promise<DocumentScan> {
    const expiry = computeReviewExpiry({
      createdAt: scan.createdAt || new Date(),
      startDate: scan.extractedFields?.startDate,
      endDate: scan.extractedFields?.endDate,
    });
    if (!shouldExpire(scan.reviewStatus, expiry)) return scan;
    const from = scan.reviewStatus;
    scan.reviewStatus = 'expired';
    scan.expiredAt = new Date();
    const saved = await this.scanRepo.save(scan);
    await this.recordRevision(
      scan.schoolId,
      scan.id,
      { id: 'system', role: 'system' },
      'expired',
      from,
      'expired',
      null,
      `Review window passed (${expiry.toISOString().slice(0, 10)})`,
    );
    return saved;
  }

  private async getRawById(schoolId: string, id: string): Promise<DocumentScan> {
    const scan = await this.scanRepo.findOne({ where: { id, schoolId } });
    if (!scan) throw ApiError.notFound('Document scan not found');
    return this.applyLazyExpiry(scan);
  }

  /**
   * SAM does image SEGMENTATION ONLY: bounding boxes / masks. It does not
   * read text and does not understand the document. Semantic extraction
   * (type, names, dates, reason) is the Vision LLM's job, in scanDocument().
   * Two wirings are supported:
   *  - Meta Model API (official): SAM 3.1 via POST {SAM_API_URL}/responses
   *    with the same Bearer key as Muse; boxes/masks come back encoded in
   *    the output text as <|box;...|> / <|mask;...|> tokens.
   *  - Legacy self-hosted SAM server: POST {SAM_API_URL}/segment.
   * Only geometric fields are allow-listed from the SAM response.
   */
  private async runSegmentation(
    file: UploadedDocumentFile,
  ): Promise<Record<string, unknown>> {
    if (!file.mimetype.startsWith('image/')) {
      return { provider: 'unavailable', reason: 'Segmentation is image-only; PDFs are reviewed manually by a human.' };
    }
    if (!env.ai.samApiUrl) {
      return { provider: 'unavailable', reason: 'SAM_API_URL not configured' };
    }
    if (env.NODE_ENV === 'production' && !env.ai.samApiUrl.startsWith('https://')) {
      return { provider: 'unavailable', reason: 'SAM_API_URL must use HTTPS in production; segmentation skipped.' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.ai.timeoutMs);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (env.ai.samApiKey) headers.Authorization = `Bearer ${env.ai.samApiKey}`;

      // Meta Model API: SAM 3.1 has no /segment endpoint; segmentation runs
      // through the Responses API with a text prompt + the image.
      if (env.ai.samApiUrl.includes('api.meta.ai')) {
        const response = await fetch(`${env.ai.samApiUrl.replace(/\/$/, '')}/responses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: env.ai.samModel,
            input: [
              {
                role: 'user',
                content: [
                  { type: 'input_text', text: 'document' },
                  {
                    type: 'input_image',
                    image_url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          return { provider: 'sam', reason: `SAM request failed (${response.status})` };
        }
        const data: unknown = await response.json();
        const outputText = isRecord(data) && Array.isArray(data.output)
          ? data.output
              .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
              .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
              .join('')
          : '';
        const boxes = [...outputText.matchAll(/<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)\|>/g)].map(
          (m) => ({ x1: Number(m[1]), y1: Number(m[2]), x2: Number(m[3]), y2: Number(m[4]), w: Number(m[5]), h: Number(m[6]) }),
        );
        if (boxes.length === 0) {
          return { provider: 'sam', reason: 'SAM returned no document region' };
        }
        return {
          provider: 'sam',
          model: env.ai.samModel,
          role: 'segmentation_only',
          bbox: boxes[0],
          boxes,
          maskPresent: outputText.includes('<|mask;'),
        };
      }

      const response = await fetch(`${env.ai.samApiUrl.replace(/\/$/, '')}/segment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return { provider: 'sam', reason: `SAM request failed (${response.status})` };
      }

      const data: unknown = await response.json();
      if (!isRecord(data)) {
        return { provider: 'sam', reason: 'SAM returned an unexpected response' };
      }

      const segmentation: Record<string, unknown> = { provider: 'sam', role: 'segmentation_only' };
      if (data.bbox !== undefined) segmentation.bbox = data.bbox;
      const polygon = data.polygon ?? data.points;
      if (polygon !== undefined) segmentation.polygon = polygon;
      const areaRatio = data.maskAreaRatio ?? data.areaRatio;
      if (typeof areaRatio === 'number') segmentation.maskAreaRatio = areaRatio;
      if (typeof data.confidence === 'number') segmentation.confidence = data.confidence;
      return segmentation;
    } catch (error) {
      return {
        provider: 'sam',
        reason: error instanceof Error ? error.message : 'SAM segmentation failed',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async scanDocument(
    schoolId: string,
    uploadedBy: string,
    file: UploadedDocumentFile,
    options?: ScanDocumentOptions,
    actorRole = 'school_admin',
  ): Promise<PublicDocumentScan> {
    if (!file || !file.buffer) throw ApiError.badRequest('File is required');

    // Defence in depth: the client-declared MIME type is never trusted.
    // The real type is sniffed from magic bytes and must match the claim;
    // PDFs carrying scripts/embedded files are rejected outright.
    const validation = validateDocumentBuffer({
      buffer: file.buffer,
      declaredMime: file.mimetype,
      size: file.size,
    });
    if (!validation.ok || !validation.detectedMime) {
      const messages: Record<string, string> = {
        empty: 'File is empty',
        too_large: 'File exceeds the 10MB limit',
        unsupported: 'Unsupported file type (only JPEG, PNG, WebP images or PDF are accepted)',
        mime_mismatch: 'File content does not match its declared type',
        active_content: 'PDF files with scripts or embedded files are not accepted',
      };
      throw ApiError.badRequest(messages[validation.errorCode || 'unsupported']);
    }
    const detectedMime = validation.detectedMime;

    const hint: DocumentType = isDocumentType(options?.documentType)
      ? options.documentType
      : 'unknown';

    let student: Student | null = null;
    if (options?.studentId) {
      student = await this.studentRepo.findOne({
        where: { id: options.studentId, schoolId },
      });
      if (!student) throw ApiError.notFound('Student not found');
    }

    // Duplicate prevention (file level): identical bytes already submitted
    // in this school are never stored or analysed twice.
    const contentHash = computeContentHash(file.buffer);
    const duplicate = await this.scanRepo.findOne({
      where: { schoolId, contentHash },
      order: { createdAt: 'ASC' },
    });
    if (duplicate && duplicate.status !== 'failed') {
      if (options?.studentId && duplicate.studentId && duplicate.studentId !== options.studentId) {
        throw ApiError.conflict('This file has already been submitted for another student');
      }
      await this.recordRevision(
        schoolId,
        duplicate.id,
        { id: uploadedBy, role: actorRole },
        'duplicate_upload_blocked',
        duplicate.reviewStatus,
        duplicate.reviewStatus,
        null,
        'Identical file bytes (SHA-256) already exist; upload returned the existing document',
      );
      return toPublic(await this.applyLazyExpiry(duplicate));
    }

    const dir = this.uploadDir();
    await fs.promises.mkdir(dir, { recursive: true });
    const encryptedPath = path.join(dir, `${crypto.randomUUID()}.enc`);
    await fs.promises.writeFile(encryptedPath, encryptBuffer(file.buffer), { mode: 0o600 });

    const row = this.scanRepo.create({
      schoolId,
      uploadedById: uploadedBy,
      studentId: options?.studentId || null,
      originalName: sanitizeOriginalName(file.originalname),
      mimeType: detectedMime,
      sizeBytes: file.size,
      encryptedPath,
      status: 'processing',
      documentType: hint,
      extractedText: null,
      extractedFields: null,
      segmentation: null,
      confidence: null,
      error: null,
      reviewStatus: 'pending_review',
      contentHash,
      duplicateOfId: null,
      approvedStartDate: null,
      approvedEndDate: null,
      archivedById: null,
      archivedAt: null,
      expiredAt: null,
      verification: null,
      confirmedById: null,
      confirmedAt: null,
      reviewedById: null,
      reviewedByRole: null,
      reviewedAt: null,
      reviewNote: null,
      appliedAttendanceIds: null,
      appliedCourseAttendanceIds: null,
    });

    const saved = await this.scanRepo.save(row);
    await this.logAccess(schoolId, saved.id, { id: uploadedBy, role: actorRole }, 'upload');
    await this.recordRevision(
      schoolId,
      saved.id,
      { id: uploadedBy, role: actorRole },
      'uploaded',
      null,
      'pending_review',
    );

    try {
      saved.segmentation = await this.runSegmentation({ ...file, mimetype: detectedMime });
      const isImage = detectedMime.startsWith('image/');

      // Vision LLM (semantic understanding/extraction). SAM output above is
      // never used as text evidence, and this extraction NEVER justifies an
      // absence by itself: the row stays pending_review until a human acts.
      let extractionSkipped = true;
      if (isImage && isMetaAiEnabled()) {
        extractionSkipped = false;
        try {
          const extraction = await chatVisionJson<VisionExtractionResponse>(
            'Extract document information and respond only with JSON: {documentType: one of absence_justification|medical_certificate|invoice|other|unknown, title (the heading/title printed on the document), studentName (full name of the person concerned), firstName, lastName, dateOfBirth, ageYears (age of the person concerned as stated in the document, number or null), issueDate (date the document was issued/written), startDate (absence/coverage start), endDate (absence/coverage end), reason, issuer (issuing authority/organisation, e.g. clinic, doctor, school or administration), summary (a comprehensive summary of the document content in the document language), confidence (0-1), extractedText}. All dates must be YYYY-MM-DD. Use null for unknown fields.',
            file.buffer.toString('base64'),
            detectedMime,
          );

          if (isDocumentType(extraction.documentType)) {
            saved.documentType = extraction.documentType;
          }

          const fields: ExtractedDocumentFields = {};
          const extractedValues: Record<keyof ExtractedDocumentFields, string | undefined> = {
            title: stringField(extraction.title),
            studentName: stringField(extraction.studentName),
            firstName: stringField(extraction.firstName),
            lastName: stringField(extraction.lastName),
            dateOfBirth: stringField(extraction.dateOfBirth),
            ageYears:
              parseAgeYears(extraction.ageYears) !== null
                ? String(parseAgeYears(extraction.ageYears))
                : stringField(extraction.ageYears),
            issueDate: stringField(extraction.issueDate),
            startDate: stringField(extraction.startDate),
            endDate: stringField(extraction.endDate),
            reason: stringField(extraction.reason),
            issuer: stringField(extraction.issuer),
            summary: stringField(extraction.summary),
          };
          for (const key of FIELD_KEYS) {
            const value = extractedValues[key];
            if (value) fields[key] = value;
          }
          if (!fields.studentName && (fields.firstName || fields.lastName)) {
            fields.studentName = [fields.firstName, fields.lastName].filter(Boolean).join(' ');
          }
          saved.extractedFields = Object.keys(fields).length > 0 ? fields : null;
          saved.extractedText = stringField(extraction.extractedText) || null;
          saved.confidence = normalizeConfidence(extraction.confidence);
        } catch {
          saved.documentType = hint;
          saved.extractedText = null;
          extractionSkipped = true;
        }
      }

      saved.verification = buildVerification({
        student: student
          ? { firstName: student.firstName, lastName: student.lastName, dateOfBirth: student.dateOfBirth }
          : null,
        fields: saved.extractedFields,
        confidence: saved.confidence,
        extractionSkipped,
      });
      saved.status = 'completed';
      saved.error = null;
      const done = await this.scanRepo.save(saved);
      await this.recordRevision(
        schoolId,
        done.id,
        { id: uploadedBy, role: actorRole },
        'analysis_completed',
        'pending_review',
        done.reviewStatus,
      );
      return toPublic(await this.applyLazyExpiry(done));
    } catch (error) {
      saved.status = 'failed';
      saved.error = error instanceof Error ? error.message : 'Document scan failed';
      const failed = await this.scanRepo.save(saved);
      await this.recordRevision(
        schoolId,
        failed.id,
        { id: uploadedBy, role: actorRole },
        'analysis_failed',
        'pending_review',
        failed.reviewStatus,
        null,
        failed.error,
      );
      return toPublic(failed);
    }
  }

  async confirm(
    schoolId: string,
    id: string,
    actor: DocumentActor,
    payload: { extractedFields?: Record<string, unknown>; documentType?: unknown },
  ): Promise<PublicDocumentScan> {
    const scan = await this.getRawById(schoolId, id);
    if (!isActionableLifecycleStatus(scan.reviewStatus)) {
      throw ApiError.conflict(`Document in status "${scan.reviewStatus}" can no longer be confirmed or corrected`);
    }
    if (scan.status !== 'completed') {
      throw ApiError.badRequest('Document analysis is not completed yet');
    }

    const fromStatus = scan.reviewStatus;
    const snapshotFields = (): Record<string, string | null> => ({
      documentType: scan.documentType,
      ...Object.fromEntries(FIELD_KEYS.map((key) => [key, scan.extractedFields?.[key] || null])),
    });
    const beforeFields = snapshotFields();

    if (isDocumentType(payload.documentType)) scan.documentType = payload.documentType;

    if (payload.extractedFields && isRecord(payload.extractedFields)) {
      const merged: ExtractedDocumentFields = { ...(scan.extractedFields || {}) };
      for (const key of FIELD_KEYS) {
        const value = payload.extractedFields[key];
        if (value === undefined) continue;
        const text = stringField(value) || (key === 'ageYears' && parseAgeYears(value) !== null ? String(parseAgeYears(value)) : undefined);
        if (!text) continue;
        const maxLength = key === 'summary' ? 2000 : 500;
        if (text.length > maxLength) throw ApiError.badRequest(`Field "${key}" is too long`);
        if (DATE_FIELD_KEYS.has(key) && !isValidDateString(text)) {
          throw ApiError.badRequest(`Field "${key}" must be a valid YYYY-MM-DD date`);
        }
        if (key === 'ageYears' && parseAgeYears(text) === null) {
          throw ApiError.badRequest('Field "ageYears" must be an age in years (0-120)');
        }
        merged[key] = key === 'ageYears' ? String(parseAgeYears(text)) : text;
      }
      if (!merged.studentName && (merged.firstName || merged.lastName)) {
        merged.studentName = [merged.firstName, merged.lastName].filter(Boolean).join(' ');
      }
      scan.extractedFields = merged;
    }

    const student = scan.studentId
      ? await this.studentRepo.findOne({ where: { id: scan.studentId, schoolId } })
      : null;
    scan.verification = buildVerification({
      student: student
        ? { firstName: student.firstName, lastName: student.lastName, dateOfBirth: student.dateOfBirth }
        : null,
      fields: scan.extractedFields,
      confidence: scan.confidence,
      extractionSkipped: scan.verification?.extractionSkipped ?? false,
    });
    const afterFields = snapshotFields();
    const changes: Record<string, DocumentFieldChange> = {};
    for (const key of Object.keys(beforeFields)) {
      if (beforeFields[key] !== afterFields[key]) {
        changes[key] = { from: beforeFields[key], to: afterFields[key] };
      }
    }

    scan.reviewStatus = 'confirmed';
    scan.confirmedById = actor.id;
    scan.confirmedAt = new Date();
    const saved = await this.scanRepo.save(scan);
    if (Object.keys(changes).length > 0) {
      await this.recordRevision(schoolId, id, actor, 'fields_corrected', fromStatus, saved.reviewStatus, changes);
    }
    if (fromStatus !== 'confirmed') {
      await this.recordRevision(schoolId, id, actor, 'confirmed', fromStatus, 'confirmed');
    }
    await this.logAccess(schoolId, id, actor, 'confirm');
    return toPublic(saved);
  }

  async review(
    schoolId: string,
    id: string,
    actor: DocumentActor,
    payload: {
      decision: 'approved' | 'rejected';
      note?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PublicDocumentScan> {
    if (actor.role !== 'school_admin') {
      throw ApiError.forbidden('Only a school admin can approve or reject a justification document');
    }
    const scan = await this.getRawById(schoolId, id);
    if (!canTransition(scan.reviewStatus, payload.decision === 'approved' ? 'approved' : 'rejected')) {
      throw ApiError.conflict(`Document in status "${scan.reviewStatus}" cannot be reviewed`);
    }
    if (scan.status !== 'completed') {
      throw ApiError.badRequest('Document analysis is not completed yet');
    }
    const note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 1000) : '';
    const fromStatus = scan.reviewStatus;

    if (payload.decision === 'rejected') {
      scan.reviewStatus = 'rejected';
      scan.reviewedById = actor.id;
      scan.reviewedByRole = actor.role;
      scan.reviewedAt = new Date();
      scan.reviewNote = note || null;
      const saved = await this.scanRepo.save(scan);
      await this.recordRevision(schoolId, id, actor, 'rejected', fromStatus, 'rejected', null, note || null);
      await this.logAccess(schoolId, id, actor, 'reject');
      await this.notifyStudentParent(schoolId, scan.studentId, false);
      return toPublic(saved);
    }

    // Approval is the ONLY path that may touch absence records, and it is a
    // deliberate human (school_admin) action — never an AI side effect.
    if (!scan.studentId) {
      throw ApiError.badRequest('Document is not linked to a student; link a student before approving');
    }
    const student = await this.studentRepo.findOne({
      where: { id: scan.studentId, schoolId },
    });
    if (!student) throw ApiError.notFound('Student not found');

    const startDate = payload.startDate || scan.extractedFields?.startDate;
    const endDate = payload.endDate || scan.extractedFields?.endDate || startDate;
    if (!isValidDateString(startDate) || !isValidDateString(endDate) || endDate < startDate) {
      throw ApiError.badRequest(
        'A valid absence date range (startDate/endDate, YYYY-MM-DD) is required to approve; supply it in the review or correct the extracted fields first',
      );
    }

    const justificationText =
      [scan.extractedFields?.reason, note].filter(Boolean).join(' — ').slice(0, 1000) ||
      `Approved justification document (${scan.documentType})`;

    const result = await AppDataSource.transaction(async (manager) => {
      const attendanceRepo = manager.getRepository(Attendance);
      const courseAttendanceRepo = manager.getRepository(CourseAttendance);
      const scanTxRepo = manager.getRepository(DocumentScan);

      // Overlap prevention (period level): another document already approved
      // for this student may not cover any day of the requested range. This
      // also turns multi-day certificates into stored coverage ranges, so a
      // second certificate re-covering the same days is rejected outright;
      // the admin can re-approve with a narrowed, non-overlapping range.
      const priorApproved = await scanTxRepo.find({
        where: {
          schoolId,
          studentId: scan.studentId as string,
          approvedStartDate: Not(IsNull()),
          approvedEndDate: Not(IsNull()),
          id: Not(scan.id),
        },
      });
      const overlapping = findOverlappingCoverage(
        { startDate, endDate },
        priorApproved
          .filter((d) => d.approvedStartDate && d.approvedEndDate)
          .map((d) => ({
            id: d.id,
            startDate: d.approvedStartDate as string,
            endDate: d.approvedEndDate as string,
          })),
      );
      if (overlapping.length > 0) {
        const first = overlapping[0];
        throw ApiError.conflict(
          `Coverage ${startDate}..${endDate} overlaps already-approved document ${first.id} (${first.startDate}..${first.endDate}); duplicate justification prevented`,
        );
      }

      const [allAttendances, allCourseAttendances] = await Promise.all([
        attendanceRepo.find({
          where: {
            schoolId,
            studentId: scan.studentId as string,
            isAbsent: true,
            date: Between(startDate, endDate),
          },
        }),
        courseAttendanceRepo.find({
          where: {
            schoolId,
            studentId: scan.studentId as string,
            isAbsent: true,
            date: Between(startDate, endDate),
          },
        }),
      ]);

      // Already-justified prevention (record level): records justified by an
      // earlier document or manually are never rewritten by a second approval.
      const attendances = allAttendances.filter((r) => !r.justified);
      const courseAttendances = allCourseAttendances.filter((r) => !r.justified);

      if (allAttendances.length === 0 && allCourseAttendances.length === 0) {
        throw ApiError.badRequest(
          `No absence records found for this student between ${startDate} and ${endDate}; nothing was justified`,
        );
      }
      if (attendances.length === 0 && courseAttendances.length === 0) {
        throw ApiError.conflict(
          `All absences between ${startDate} and ${endDate} are already justified; duplicate justification prevented`,
        );
      }

      for (const record of attendances) {
        record.justified = true;
        record.justification = justificationText;
      }
      for (const record of courseAttendances) {
        record.justified = true;
        record.justification = justificationText;
      }
      if (attendances.length > 0) await attendanceRepo.save(attendances);
      if (courseAttendances.length > 0) await courseAttendanceRepo.save(courseAttendances);

      scan.reviewStatus = 'approved';
      scan.reviewedById = actor.id;
      scan.reviewedByRole = actor.role;
      scan.reviewedAt = new Date();
      scan.reviewNote = note || null;
      scan.approvedStartDate = startDate;
      scan.approvedEndDate = endDate;
      scan.appliedAttendanceIds = attendances.map((r) => r.id);
      scan.appliedCourseAttendanceIds = courseAttendances.map((r) => r.id);
      const savedScan = await scanTxRepo.save(scan);
      await this.recordRevision(
        schoolId,
        scan.id,
        actor,
        'approved',
        fromStatus,
        'approved',
        {
          coverage: { from: null, to: `${startDate}..${endDate}` },
          appliedAttendances: { from: null, to: String(attendances.length + courseAttendances.length) },
        },
        note || null,
        manager,
      );
      return savedScan;
    });

    await this.logAccess(schoolId, id, actor, 'approve');
    await this.notifyStudentParent(schoolId, scan.studentId, true);
    return toPublic(result);
  }

  private async notifyStudentParent(
    schoolId: string,
    studentId: string | null,
    approved: boolean,
  ): Promise<void> {
    if (!studentId) return;
    try {
      const student = await this.studentRepo.findOne({ where: { id: studentId, schoolId } });
      if (!student?.parentId) return;
      const repo = AppDataSource.getRepository(Notification);
      await repo.save(
        repo.create({
          title: approved ? 'تم قبول مبرر الغياب' : 'تم رفض مبرر الغياب',
          message: approved
            ? 'وافقت الإدارة على وثيقة تبرير الغياب وتم تحديث حالة الغياب.'
            : 'رفضت الإدارة وثيقة تبرير الغياب. يمكنك مراجعة الإدارة أو تقديم وثيقة جديدة.',
          type: 'absence',
          recipientId: student.parentId,
          recipientRole: 'parent',
          schoolId,
          link: '/parent/dashboard',
        }),
      );
    } catch {
      // Notification failure must not roll back the review decision.
    }
  }

  async archive(
    schoolId: string,
    id: string,
    actor: DocumentActor,
  ): Promise<PublicDocumentScan> {
    if (actor.role !== 'school_admin') {
      throw ApiError.forbidden('Only a school admin can archive a document');
    }
    const scan = await this.getRawById(schoolId, id);
    if (!canTransition(scan.reviewStatus, 'archived')) {
      throw ApiError.conflict(`Document in status "${scan.reviewStatus}" cannot be archived`);
    }
    const fromStatus = scan.reviewStatus;
    scan.reviewStatus = 'archived';
    scan.archivedById = actor.id;
    scan.archivedAt = new Date();
    const saved = await this.scanRepo.save(scan);
    await this.recordRevision(schoolId, id, actor, 'archived', fromStatus, 'archived');
    return toPublic(saved);
  }

  async expireStale(schoolId: string): Promise<{ expired: number; documentIds: string[] }> {
    const rows = await this.scanRepo.find({ where: { schoolId } });
    const expiredIds: string[] = [];
    for (const row of rows) {
      if (!isActionableLifecycleStatus(row.reviewStatus)) continue;
      const before = row.reviewStatus;
      const after = await this.applyLazyExpiry(row);
      if (before !== after.reviewStatus && after.reviewStatus === 'expired') {
        expiredIds.push(after.id);
      }
    }
    return { expired: expiredIds.length, documentIds: expiredIds };
  }

  async getHistory(
    schoolId: string,
    id: string,
    includeActorIds: boolean,
  ): Promise<PublicDocumentRevision[]> {
    await this.getRawById(schoolId, id);
    const rows = await this.revisionRepo.find({
      where: { schoolId, documentId: id },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => {
      if (includeActorIds) return row;
      const { actorId: _actorId, ...rest } = row;
      return rest;
    });
  }

  async list(schoolId: string, studentIds?: string[]): Promise<PublicDocumentScan[]> {
    if (studentIds !== undefined) {
      if (studentIds.length === 0) return [];
      const rows = await this.scanRepo.find({
        where: { schoolId, studentId: In(studentIds) },
        order: { createdAt: 'DESC' },
      });
      const checked: DocumentScan[] = [];
      for (const row of rows) checked.push(await this.applyLazyExpiry(row));
      return checked.map(toPublic);
    }
    const rows = await this.scanRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
    const expiredChecked: DocumentScan[] = [];
    for (const row of rows) expiredChecked.push(await this.applyLazyExpiry(row));
    return expiredChecked.map(toPublic);
  }

  async getById(
    schoolId: string,
    id: string,
    actor?: DocumentActor,
  ): Promise<PublicDocumentScan> {
    const scan = await this.getRawById(schoolId, id);
    if (actor) await this.logAccess(schoolId, id, actor, 'view');
    return toPublic(scan);
  }

  private async readFile(
    schoolId: string,
    id: string,
    actor: DocumentActor,
    action: DocumentAccessAction,
  ): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    const scan = await this.getRawById(schoolId, id);
    const encrypted = await fs.promises.readFile(scan.encryptedPath);
    const buffer = decryptBuffer(encrypted);
    await this.logAccess(schoolId, id, actor, action);
    return {
      buffer,
      mimeType: scan.mimeType,
      originalName: scan.originalName,
    };
  }

  async readDecrypted(
    schoolId: string,
    id: string,
    actor: DocumentActor,
  ): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    return this.readFile(schoolId, id, actor, 'download_decrypted');
  }

  async readForPreview(
    schoolId: string,
    id: string,
    actor: DocumentActor,
  ): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    if (actor.role !== 'school_admin') {
      throw ApiError.forbidden('Only a school admin can open this document in the page');
    }
    return this.readFile(schoolId, id, actor, 'preview');
  }
}

export const documentVisionService = new DocumentVisionService();
