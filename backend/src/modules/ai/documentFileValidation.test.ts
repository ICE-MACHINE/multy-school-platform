import assert from 'node:assert';
import { decryptBuffer, encryptBuffer } from './documentCrypto';
import {
  detectDocumentMime,
  sanitizeOriginalName,
  validateDocumentBuffer,
} from './documentFileValidation';
import { buildVerification, isValidDateString } from './documentVision.service';

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('fake-image-body'),
]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const pdf = Buffer.from('%PDF-1.7\nhello');
const pdfWithScript = Buffer.from('%PDF-1.7\n/JavaScript (app.alert(1))');
const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);

assert.strictEqual(detectDocumentMime(png), 'image/png');
assert.strictEqual(detectDocumentMime(jpeg), 'image/jpeg');
assert.strictEqual(detectDocumentMime(pdf), 'application/pdf');
assert.strictEqual(detectDocumentMime(exe), null);

assert.strictEqual(validateDocumentBuffer({ buffer: png, declaredMime: 'image/png', size: png.length }).ok, true);
assert.strictEqual(
  validateDocumentBuffer({ buffer: png, declaredMime: 'application/pdf', size: png.length }).errorCode,
  'mime_mismatch',
  'declared MIME must never be trusted over magic bytes',
);
assert.strictEqual(
  validateDocumentBuffer({ buffer: exe, declaredMime: 'image/png', size: exe.length }).errorCode,
  'unsupported',
);
assert.strictEqual(
  validateDocumentBuffer({ buffer: pdfWithScript, declaredMime: 'application/pdf', size: pdfWithScript.length }).errorCode,
  'active_content',
);
assert.strictEqual(validateDocumentBuffer({ buffer: Buffer.alloc(0), declaredMime: 'image/png', size: 0 }).errorCode, 'empty');
assert.strictEqual(sanitizeOriginalName('../../etc/certificate.png'), 'certificate.png');

const roundTrip = Buffer.from('medical certificate bytes');
assert.deepStrictEqual(decryptBuffer(encryptBuffer(roundTrip)), roundTrip);
const tampered = Buffer.from(encryptBuffer(roundTrip));
tampered[tampered.length - 1] ^= 0xff;
assert.throws(() => decryptBuffer(tampered), Error, 'AES-GCM must reject tampered ciphertext');

assert.strictEqual(isValidDateString('2026-02-29'), false);
assert.strictEqual(isValidDateString('2026-02-28'), true);
assert.strictEqual(isValidDateString('28/02/2026'), false);

const verification = buildVerification({
  studentFullName: 'Amine Benali',
  fields: { studentName: 'Someone Else', startDate: '2026-01-05', endDate: '2026-01-03' },
  confidence: 0.4,
  extractionSkipped: false,
});
assert.strictEqual(verification.requiresHumanReview, true);
assert.strictEqual(verification.studentNameMatches, false);
assert.strictEqual(verification.datesValid, false);
assert.strictEqual(verification.lowConfidence, true);
assert.ok(verification.checks.includes('awaiting_human_review'));

console.log('document validation/crypto/verification tests passed');
