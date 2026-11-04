import assert from 'node:assert';
import {
  canTransition,
  computeReviewExpiry,
  dateRangesOverlap,
  findOverlappingCoverage,
  shouldExpire,
} from './documentLifecycle';
import { computeContentHash } from './documentFileValidation';

assert.strictEqual(canTransition('pending_review', 'confirmed'), true);
assert.strictEqual(canTransition('pending_review', 'approved'), true);
assert.strictEqual(canTransition('confirmed', 'rejected'), true);
assert.strictEqual(canTransition('approved', 'archived'), true);
assert.strictEqual(canTransition('rejected', 'archived'), true);
assert.strictEqual(canTransition('expired', 'archived'), true);
assert.strictEqual(canTransition('approved', 'rejected'), false, 'final decisions cannot be flipped');
assert.strictEqual(canTransition('archived', 'approved'), false, 'archived is terminal');
assert.strictEqual(canTransition('expired', 'approved'), false, 'expired documents cannot be approved');
assert.strictEqual(canTransition('pending_review', 'archived'), false, 'unreviewed documents go through expiry, not direct archive');

const multiDayExpiry = computeReviewExpiry({
  createdAt: '2026-01-01T00:00:00Z',
  startDate: '2026-02-01',
  endDate: '2026-02-05',
});
assert.strictEqual(multiDayExpiry.toISOString().slice(0, 10), '2026-03-07');
assert.strictEqual(
  shouldExpire('pending_review', multiDayExpiry, new Date('2026-03-08T00:00:00Z')),
  true,
);
assert.strictEqual(
  shouldExpire('pending_review', multiDayExpiry, new Date('2026-03-01T00:00:00Z')),
  false,
);
assert.strictEqual(
  shouldExpire('approved', multiDayExpiry, new Date('2027-01-01T00:00:00Z')),
  false,
  'approved documents archive, they do not expire',
);

const noDateExpiry = computeReviewExpiry({ createdAt: '2026-01-01T00:00:00Z' });
assert.strictEqual(noDateExpiry.toISOString().slice(0, 10), '2026-04-01');

assert.strictEqual(dateRangesOverlap('2026-02-01', '2026-02-05', '2026-02-05', '2026-02-07'), true, 'shared edge day overlaps');
assert.strictEqual(dateRangesOverlap('2026-02-01', '2026-02-05', '2026-02-06', '2026-02-07'), false);
assert.strictEqual(dateRangesOverlap('2026-02-03', '2026-02-04', '2026-02-01', '2026-02-10'), true, 'contained range overlaps');

const priorApproved = [
  { id: 'doc-a', startDate: '2026-02-01', endDate: '2026-02-05' },
  { id: 'doc-b', startDate: '2026-03-01', endDate: '2026-03-02' },
];
const hits = findOverlappingCoverage({ startDate: '2026-02-04', endDate: '2026-02-10' }, priorApproved);
assert.deepStrictEqual(hits.map((h) => h.id), ['doc-a']);
assert.deepStrictEqual(
  findOverlappingCoverage({ startDate: '2026-02-06', endDate: '2026-02-28' }, priorApproved),
  [],
  'a narrowed non-overlapping approval range must be allowed',
);

const fileA = Buffer.from('certificate-image-bytes');
const fileACopy = Buffer.from('certificate-image-bytes');
const fileB = Buffer.from('different-certificate-bytes');
assert.strictEqual(computeContentHash(fileA), computeContentHash(fileACopy), 'identical bytes must collide');
assert.notStrictEqual(computeContentHash(fileA), computeContentHash(fileB));

console.log('document lifecycle tests passed');
