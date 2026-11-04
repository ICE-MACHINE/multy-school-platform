import crypto from 'crypto';

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function computeContentHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function detectDocumentMime(buffer: Buffer): AllowedDocumentMimeType | null {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return 'image/png';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

export interface DocumentValidationResult {
  ok: boolean;
  detectedMime: AllowedDocumentMimeType | null;
  errorCode?: 'empty' | 'too_large' | 'unsupported' | 'mime_mismatch' | 'active_content';
}

export function validateDocumentBuffer(input: {
  buffer: Buffer;
  declaredMime: string;
  size: number;
}): DocumentValidationResult {
  const { buffer, declaredMime, size } = input;
  if (!buffer || buffer.length === 0 || size === 0) {
    return { ok: false, detectedMime: null, errorCode: 'empty' };
  }
  if (size > MAX_DOCUMENT_SIZE_BYTES || buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    return { ok: false, detectedMime: null, errorCode: 'too_large' };
  }
  const detectedMime = detectDocumentMime(buffer);
  if (!detectedMime) return { ok: false, detectedMime: null, errorCode: 'unsupported' };
  if (detectedMime !== declaredMime) {
    return { ok: false, detectedMime, errorCode: 'mime_mismatch' };
  }
  if (detectedMime === 'application/pdf') {
    const head = buffer.toString('latin1', 0, Math.min(buffer.length, 1024 * 1024));
    if (/\/JavaScript|\/JS\s|\/Launch|\/EmbeddedFile/.test(head)) {
      return { ok: false, detectedMime, errorCode: 'active_content' };
    }
  }
  return { ok: true, detectedMime };
}

export function sanitizeOriginalName(name: string): string {
  const base = name.replace(/\\/g, '/').split('/').pop() || 'document';
  const cleaned = base.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return (cleaned.length > 0 ? cleaned : 'document').slice(0, 255);
}
