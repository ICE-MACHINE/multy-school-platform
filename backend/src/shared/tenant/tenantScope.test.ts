import assert from 'node:assert';
import type { NextFunction, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { generateAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import {
  actorMatchesSchool,
  assertEntityInSchool,
  assertParentOwnsStudent,
  scopedWhere,
} from './tenantScope';

assert.strictEqual(actorMatchesSchool({ id: 'u1', role: 'teacher', schoolId: 'A' }, 'B'), false);
assert.strictEqual(actorMatchesSchool({ id: 'u1', role: 'teacher', schoolId: 'A' }, 'A'), true);
assert.strictEqual(
  actorMatchesSchool({ id: 'u1', role: 'teacher', schoolId: 'slug-a', slug: 'slug-a' }, 'uuid-a', 'slug-a'),
  true,
);
assert.deepStrictEqual(scopedWhere('A', { isActive: true }), { isActive: true, schoolId: 'A' });

assert.throws(() => assertEntityInSchool('B', 'A', 'Student'), /Student not found/);
assert.throws(
  () => assertParentOwnsStudent('parent-2', { id: 'parent-1', role: 'parent' }),
  /access to this student/,
);
assertParentOwnsStudent('parent-1', { id: 'admin-1', role: 'school_admin' });

function runAuthenticate(resolvedSchoolId: string, tokenSchoolId: string, schoolSlug = 'school-b'): unknown {
  const token = generateAccessToken({
    id: 'teacher-1',
    role: 'teacher',
    schoolId: tokenSchoolId,
    slug: 'school-a',
  });
  let captured: unknown = null;
  const req = {
    headers: { authorization: `Bearer ${token}` },
    resolvedSchoolId,
    schoolSlug,
  } as unknown as Request;
  authenticate(req, {} as Response, ((err?: unknown) => {
    captured = err ?? null;
  }) as NextFunction);
  return captured;
}

const crossSchool = runAuthenticate('school-B-uuid', 'school-A-uuid');
assert.ok(crossSchool instanceof ApiError, 'school A token must be rejected on a school B route');
assert.strictEqual((crossSchool as ApiError).statusCode, 403);

const sameSchool = runAuthenticate('school-A-uuid', 'school-A-uuid', 'school-a');
assert.strictEqual(sameSchool, null, 'school A token must pass on its own school route');

console.log('tenant isolation tests passed');
