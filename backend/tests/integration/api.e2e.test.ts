/**
 * API integration / E2E tests.
 *
 * Boots the real Express app against a dedicated, freshly-created MySQL
 * database (multyschool_test, dropped & recreated on every run — never the
 * dev database), seeds two schools with real users, logs in through the real
 * HTTP login endpoints, and replays actual user scenarios.
 *
 * Run: npm run test:integration   (requires MySQL, same creds as .env)
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DB_DATABASE = 'multyschool_test';
process.env.META_AI_API_KEY = '';
process.env.META_AI_MODEL = '';
process.env.META_AI_VISION_MODEL = '';
process.env.SAM_API_URL = '';
process.env.AI_AUTO_APPROVE_SCHEDULE = 'false';

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('integration-medical-certificate-bytes'),
]);
const PNG_BYTES_2 = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('a-different-certificate-for-overlap-test'),
]);

function readDotEnv(): Record<string, string> {
  const file = path.join(__dirname, '../../.env');
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

async function resetTestDatabase(): Promise<void> {
  const dotEnv = readDotEnv();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || dotEnv.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || dotEnv.DB_PORT || 3306),
    user: process.env.DB_USERNAME || dotEnv.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || dotEnv.DB_PASSWORD || '',
  });
  await conn.query('DROP DATABASE IF EXISTS multyschool_test');
  await conn.query('CREATE DATABASE multyschool_test');
  await conn.end();
}

let passed = 0;
function check(name: string, condition: boolean, detail?: unknown): void {
  assert.ok(condition, `${name}${detail !== undefined ? ` — ${JSON.stringify(detail)?.slice(0, 400)}` : ''}`);
  passed += 1;
  console.log(`  ✓ ${name}`);
}

async function main(): Promise<void> {
  await resetTestDatabase();

  const { AppDataSource } = await import('../../src/config/data-source');
  const { default: app } = await import('../../src/app');
  const { hashPassword } = await import('../../src/shared/utils/hash');
  const { School } = await import('../../src/modules/school/school.entity');
  const { SchoolAdmin } = await import('../../src/modules/schoolAdmin/schoolAdmin.entity');
  const { SuperAdmin } = await import('../../src/modules/superAdmin/superAdmin.entity');
  const { Teacher } = await import('../../src/modules/teacher/teacher.entity');
  const { Parent } = await import('../../src/modules/parent/parent.entity');
  const { Student } = await import('../../src/modules/student/student.entity');
  const { Course } = await import('../../src/modules/course/course.entity');
  const { ScheduleChangeRequest } = await import('../../src/modules/timetable/scheduleChangeRequest.entity');
  const { TimetableSettings } = await import('../../src/modules/timetable/timetableSettings.entity');
  const { TimetableSlot } = await import('../../src/modules/timetable/timetableSlot.entity');
  const { Attendance } = await import('../../src/modules/attendance/attendance.entity');

  await AppDataSource.initialize();
  const api = request(app);

  try {
    // ---------- fixtures ----------
    const schoolRepo = AppDataSource.getRepository(School);
    const password = await hashPassword('Passw0rd12345');
    const schoolA = await schoolRepo.save(schoolRepo.create({
      name: 'School A', slug: 'school-a-it', type: 'private' as never, phone: '0100', address: 'A',
      monthlyFee: 1000, maxUsers: 100, maxMessages: 1000, isActive: true, isFrozen: false,
    }));
    const schoolB = await schoolRepo.save(schoolRepo.create({
      name: 'School B', slug: 'school-b-it', type: 'private' as never, phone: '0200', address: 'B',
      monthlyFee: 1000, maxUsers: 100, maxMessages: 1000, isActive: true, isFrozen: false,
    }));

    const adminRepo = AppDataSource.getRepository(SchoolAdmin);
    const adminA = await adminRepo.save(adminRepo.create({
      firstName: 'Admin', lastName: 'A', phone: '1000000001', password, schoolId: schoolA.id,
    }));
    const adminAId = adminA.id;
    await adminRepo.save(adminRepo.create({
      firstName: 'Admin', lastName: 'B', phone: '2000000001', password, schoolId: schoolB.id,
    }));
    void adminA;

    const superRepo = AppDataSource.getRepository(SuperAdmin);
    await superRepo.save(superRepo.create({
      firstName: 'Super', lastName: 'Admin', phone: '9000000001', password, isActive: true,
    }));

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const teacherA = await teacherRepo.save(teacherRepo.create({
      firstName: 'Teacher', lastName: 'A', phone: '1000000002', password, gender: 'male' as never, schoolId: schoolA.id,
    }));

    const parentRepo = AppDataSource.getRepository(Parent);
    const parentA = await parentRepo.save(parentRepo.create({
      firstName: 'Parent', lastName: 'A', phone: '1000000003', password, gender: 'female' as never, schoolId: schoolA.id,
    }));
    const parentB = await parentRepo.save(parentRepo.create({
      firstName: 'Parent', lastName: 'B', phone: '1000000004', password, gender: 'female' as never, schoolId: schoolA.id,
    }));

    const studentRepo = AppDataSource.getRepository(Student);
    const studentA = await studentRepo.save(studentRepo.create({
      registrationNumber: 'A-001', firstName: 'Child', lastName: 'A', gender: 'male' as never,
      schoolId: schoolA.id, parentId: parentA.id,
    }));
    const studentA2 = await studentRepo.save(studentRepo.create({
      registrationNumber: 'A-002', firstName: 'Child', lastName: 'A2', gender: 'female' as never,
      schoolId: schoolA.id, parentId: parentB.id,
    }));
    const studentB = await studentRepo.save(studentRepo.create({
      registrationNumber: 'B-001', firstName: 'Child', lastName: 'B', gender: 'male' as never,
      schoolId: schoolB.id, parentId: undefined,
    }));

    const settingsRepo = AppDataSource.getRepository(TimetableSettings);
    await settingsRepo.save(settingsRepo.create({
      schoolId: schoolA.id,
      studyDays: ['sunday', 'monday'],
      periods: [
        { id: 'p1', label: 'P1', startTime: '08:00', endTime: '09:00' },
        { id: 'p2', label: 'P2', startTime: '09:15', endTime: '10:15' },
      ],
    }));
    const slotRepo = AppDataSource.getRepository(TimetableSlot);
    const slot = await slotRepo.save(slotRepo.create({
      schoolId: schoolA.id, teacherId: teacherA.id, day: 'sunday', periodId: 'p1',
      type: 'course' as never, startTime: '08:00', duration: 60,
    }));

    const courseRepo = AppDataSource.getRepository(Course);
    await courseRepo.save(courseRepo.create({
      name: 'Mathematics', schoolId: schoolA.id, teacherId: teacherA.id,
      enrolledStudents: [studentA],
    }));

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const recent = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const absenceDate = recent.toISOString().slice(0, 10);
    const absence = await attendanceRepo.save(attendanceRepo.create({
      date: absenceDate, period: 'morning' as never, isAbsent: true, justified: false,
      studentId: studentA.id, schoolId: schoolA.id,
    }));


    function setCookies(res: { headers: Record<string, unknown> }): string {
      const raw = res.headers['set-cookie'];
      return Array.isArray(raw) ? raw.join('; ') : String(raw || '');
    }
    function cookieValue(res: { headers: Record<string, unknown> }, name: string): string {
      const match = setCookies(res).match(new RegExp(`${name}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : '';
    }

    // ---------- real logins ----------
    console.log('auth & tenant isolation');
    const health = await api.get('/health');
    check('health endpoint', health.status === 200);

    const noToken = await api.get(`/api/${schoolA.slug}/students`);
    check('missing token -> 401', noToken.status === 401, noToken.status);

    const agentAdminA = request.agent(app);
    const loginA = await agentAdminA.post(`/api/auth/school/${schoolA.slug}/login`).send({ phone: '1000000001', password: 'Passw0rd12345' });
    check('school admin A login', loginA.status === 200 && Boolean(loginA.body?.data?.user), loginA.body);
    check('login returns NO tokens in JSON', loginA.body.data.accessToken === undefined && loginA.body.data.refreshToken === undefined, loginA.body.data);
    check('login sets HttpOnly access+refresh cookies', setCookies(loginA).includes('access_token=') && setCookies(loginA).includes('HttpOnly') && setCookies(loginA).includes('refresh_token='), setCookies(loginA));
    const csrfAdminA = cookieValue(loginA, 'csrf_token');
    const accessCookieAdminA = cookieValue(loginA, 'access_token');
    check('CSRF cookie issued (JS-readable for double-submit)', csrfAdminA.length >= 32);

    const agentTeacherA = request.agent(app);
    const loginTeacher = await agentTeacherA.post(`/api/auth/school/${schoolA.slug}/login`).send({ phone: '1000000002', password: 'Passw0rd12345' });
    check('teacher A login', loginTeacher.status === 200 && Boolean(loginTeacher.body?.data?.user), loginTeacher.body);
    const csrfTeacherA = cookieValue(loginTeacher, 'csrf_token');

    const agentParentA = request.agent(app);
    const loginParent = await agentParentA.post(`/api/auth/school/${schoolA.slug}/login`).send({ phone: '1000000003', password: 'Passw0rd12345' });
    check('parent A login', loginParent.status === 200 && Boolean(loginParent.body?.data?.user), loginParent.body);
    const csrfParentA = cookieValue(loginParent, 'csrf_token');
    const accessCookieParentA = cookieValue(loginParent, 'access_token');

    const agentSuper = request.agent(app);
    const loginSuper = await agentSuper.post('/api/auth/super-admin/login').send({ phone: '9000000001', password: 'Passw0rd12345' });
    check('super admin login', loginSuper.status === 200 && Boolean(loginSuper.body?.data?.user), loginSuper.body);

    const badLogin = await api.post(`/api/auth/school/${schoolA.slug}/login`).send({ phone: '1000000001', password: 'wrong-pass-1' });
    check('wrong password rejected', badLogin.status >= 400, badLogin.status);

    // ---------- tenant isolation ----------
    const ownStudents = await agentAdminA.get(`/api/${schoolA.slug}/students`);
    check('admin A lists own students', ownStudents.status === 200, ownStudents.status);
    const ownIds = JSON.stringify(ownStudents.body);
    check('own list contains A student, not B student', ownIds.includes(studentA.id) && !ownIds.includes(studentB.id));

    const crossList = await agentAdminA.get(`/api/${schoolB.slug}/students`);
    check('admin A on school B route -> 403', crossList.status === 403, crossList.status);

    const crossStudent = await agentAdminA.get(`/api/${schoolA.slug}/students/${studentB.id}`);
    check('admin A fetching B student by id -> 404 (no existence leak)', crossStudent.status === 404, crossStudent.status);

    const crossMove = await agentAdminA.patch(`/api/${schoolB.slug}/timetable/slots/${slot.id}/move`)
      .set('X-CSRF-Token', csrfAdminA)
      .send({ day: 'monday', periodId: 'p2' });
    check('admin A moving a slot under school B -> 403', crossMove.status === 403, crossMove.status);

    const otherChild = await agentParentA.get(`/api/${schoolA.slug}/students/${studentA2.id}`);
    check('parent A fetching another parent\'s child -> 403', otherChild.status === 403, otherChild.status);

    const ownChild = await agentParentA.get(`/api/${schoolA.slug}/students/${studentA.id}`);
    check('parent A fetching own child -> 200', ownChild.status === 200, ownChild.status);

    const parentCrossPrediction = await agentParentA.post(`/api/${schoolA.slug}/ai/predictions/student/${studentA2.id}`)
      .set('X-CSRF-Token', csrfParentA).send({});
    check('parent A predicting another child -> 403/404', [403, 404].includes(parentCrossPrediction.status), parentCrossPrediction.status);

    // ---------- messaging workflow (course teacher without classroom) ----------
    console.log('messaging workflow');
    const teacherRecipients = await agentTeacherA.get(`/api/${schoolA.slug}/messages/recipients`);
    check('course teacher (no classroom) sees enrolled students as recipients', teacherRecipients.status === 200 && teacherRecipients.body.data.some((r: { studentId: string }) => r.studentId === studentA.id), teacherRecipients.body);
    const teacherConversations = await agentTeacherA.get(`/api/${schoolA.slug}/messages/conversations`);
    check('course teacher conversation list includes enrolled student/parent', teacherConversations.status === 200 && teacherConversations.body.data.some((r: { studentId: string; participantId: string }) => r.studentId === studentA.id && r.participantId === parentA.id), teacherConversations.body);

    const teacherSend = await agentTeacherA.post(`/api/${schoolA.slug}/messages`)
      .set('X-CSRF-Token', csrfTeacherA)
      .send({ content: 'Hello parent', receiverId: parentA.id, studentId: studentA.id });
    check('course teacher can message enrolled student parent', teacherSend.status === 201, teacherSend.body);
    const teacherConversationId: string = teacherSend.body.data.conversationId;

    const teacherForbiddenSend = await agentTeacherA.post(`/api/${schoolA.slug}/messages`)
      .set('X-CSRF-Token', csrfTeacherA)
      .send({ content: 'Not my student', receiverId: parentB.id, studentId: studentA2.id });
    check('teacher cannot message a student not in his courses/classroom -> 403', teacherForbiddenSend.status === 403, teacherForbiddenSend.status);

    const parentConversations = await agentParentA.get(`/api/${schoolA.slug}/messages/conversations`);
    check('parent sees teacher conversation', parentConversations.status === 200 && parentConversations.body.data.some((r: { conversationId: string }) => r.conversationId === teacherConversationId), parentConversations.body);
    check('parent sees school admin as a contact', parentConversations.body.data.some((r: { participantId: string; isAdmin: boolean }) => r.participantId === adminAId && r.isAdmin), parentConversations.body);
    const parentThread = await agentParentA.get(`/api/${schoolA.slug}/messages/conversations/${teacherConversationId}`);
    check('parent can read teacher message', parentThread.status === 200 && parentThread.body.data.messages.some((m: { content: string }) => m.content === 'Hello parent'), parentThread.body);

    const parentReply = await agentParentA.post(`/api/${schoolA.slug}/messages`)
      .set('X-CSRF-Token', csrfParentA)
      .send({ content: 'Thank you', receiverId: teacherA.id, studentId: studentA.id, conversationId: teacherConversationId });
    check('parent can reply to teacher', parentReply.status === 201, parentReply.body);

    const parentToAdmin = await agentParentA.post(`/api/${schoolA.slug}/messages`)
      .set('X-CSRF-Token', csrfParentA)
      .send({ content: 'Hello administration', receiverId: adminAId });
    check('parent can start a conversation with school admin', parentToAdmin.status === 201, parentToAdmin.body);

    const parentForbidden = await agentParentA.post(`/api/${schoolA.slug}/messages`)
      .set('X-CSRF-Token', csrfParentA)
      .send({ content: 'Not my child', receiverId: teacherA.id, studentId: studentA2.id });
    check('parent cannot message about another parent child -> 403', parentForbidden.status === 403, parentForbidden.status);

    // ---------- schedule change workflow ----------
    console.log('schedule workflow');
    const csrfMissing = await agentTeacherA.post(`/api/${schoolA.slug}/timetable/requests`)
      .send({ slotId: slot.id, requestedDay: 'monday', requestedPeriodId: 'p2', reason: 'no csrf' });
    check('mutating cookie request without CSRF header -> 403', csrfMissing.status === 403, csrfMissing.status);
    const changeReq = await agentTeacherA.post(`/api/${schoolA.slug}/timetable/requests`)
      .set('X-CSRF-Token', csrfTeacherA)
      .send({ slotId: slot.id, requestedDay: 'monday', requestedPeriodId: 'p2', reason: 'Integration flow' });
    check('teacher creates schedule change request', [200, 201].includes(changeReq.status), changeReq.body);
    const changeRequestId: string = changeReq.body.data.id;

    let autoAnalysed: { aiDecision: string | null } | undefined;
    for (let attempt = 0; attempt < 20 && !autoAnalysed?.aiDecision; attempt++) {
      const pendingRes = await agentAdminA.get(`/api/${schoolA.slug}/ai/schedule-requests/pending-review`);
      autoAnalysed = (pendingRes.body.data || []).find((r: { id: string }) => r.id === changeRequestId);
      if (!autoAnalysed?.aiDecision) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    check('request is auto-analysed after creation (no manual trigger)', Boolean(autoAnalysed?.aiDecision), autoAnalysed);
    check('pending-review includes analysed approve requests awaiting admin', autoAnalysed?.aiDecision === 'approve', autoAnalysed);

    const evaluated = await agentAdminA.post(`/api/${schoolA.slug}/ai/schedule-requests/${changeRequestId}/evaluate`)
      .set('X-CSRF-Token', csrfAdminA).send({});
    check('admin evaluates schedule request', evaluated.status === 200, evaluated.body);
    check('constraint engine verdict present', evaluated.body.data.constraintFeasible === true, evaluated.body.data);
    check('deterministic decision approve (no Meta key)', evaluated.body.data.aiDecision === 'approve', evaluated.body.data.aiDecision);
    check('agent trace recorded', Array.isArray(evaluated.body.data.agentTrace) && evaluated.body.data.agentTrace.length >= 3);
    check('not auto-applied when AI_AUTO_APPROVE_SCHEDULE=false', evaluated.body.data.autoProcessed === false);

    const requestRepo = AppDataSource.getRepository(ScheduleChangeRequest);
    const staleRequest = await requestRepo.save(requestRepo.create({
      schoolId: schoolA.id, teacherId: teacherA.id, slotId: slot.id,
      requestedDay: 'monday', requestedPeriodId: 'p2', reason: 'Created before analysis (stale)',
      status: 'pending' as never, aiProcessedAt: null,
    }));
    const sweep = await agentAdminA.post(`/api/${schoolA.slug}/ai/schedule-requests/evaluate-pending`)
      .set('X-CSRF-Token', csrfAdminA).send({});
    check('evaluate-pending sweep analyses stale requests', sweep.status === 200 && sweep.body.data.evaluated >= 1, sweep.body);
    const staleAfter = await requestRepo.findOne({ where: { id: staleRequest.id } });
    check('stale request has an AI decision after sweep', Boolean(staleAfter?.aiDecision && staleAfter?.aiProcessedAt), staleAfter?.aiDecision);

    // ---------- document workflow ----------
    console.log('document workflow');
    const upload = await agentParentA.post(`/api/${schoolA.slug}/ai/documents/scan`)
      .set('X-CSRF-Token', csrfParentA)
      .field('studentId', studentA.id)
      .field('documentType', 'medical_certificate')
      .attach('file', PNG_BYTES, { filename: 'cert.png', contentType: 'image/png' });
    check('parent uploads certificate', [200, 201].includes(upload.status), upload.body);
    const docId: string = upload.body.data.id;
    check('document starts pending_review', upload.body.data.reviewStatus === 'pending_review', upload.body.data.reviewStatus);
    check('encryptedPath never exposed', upload.body.data.encryptedPath === undefined);

    const absenceBefore = await attendanceRepo.findOne({ where: { id: absence.id } });
    check('absence NOT justified by AI extraction alone', absenceBefore?.justified === false);

    const dupUpload = await agentParentA.post(`/api/${schoolA.slug}/ai/documents/scan`)
      .set('X-CSRF-Token', csrfParentA)
      .field('studentId', studentA.id)
      .field('documentType', 'medical_certificate')
      .attach('file', PNG_BYTES, { filename: 'cert-copy.png', contentType: 'image/png' });
    check('identical file upload returns existing document', dupUpload.body?.data?.id === docId, dupUpload.body?.data?.id);

    const confirm = await agentParentA.post(`/api/${schoolA.slug}/ai/documents/${docId}/confirm`)
      .set('X-CSRF-Token', csrfParentA)
      .send({ extractedFields: { studentName: 'Child A', startDate: absenceDate, endDate: absenceDate, reason: 'Flu', issuer: 'Clinic' } });
    check('parent confirms/corrects extracted fields', confirm.status === 200 && confirm.body.data.reviewStatus === 'confirmed', confirm.body);

    const parentCannotReview = await agentParentA.post(`/api/${schoolA.slug}/ai/documents/${docId}/review`)
      .set('X-CSRF-Token', csrfParentA)
      .send({ decision: 'approved' });
    check('parent cannot give final approval -> 403', parentCannotReview.status === 403, parentCannotReview.status);

    const approve = await agentAdminA.post(`/api/${schoolA.slug}/ai/documents/${docId}/review`)
      .set('X-CSRF-Token', csrfAdminA)
      .send({ decision: 'approved' });
    check('admin approves document', approve.status === 200 && approve.body.data.reviewStatus === 'approved', approve.body);
    check('approved coverage stored', approve.body.data.approvedStartDate?.slice(0, 10) === absenceDate, approve.body.data);

    const absenceAfter = await attendanceRepo.findOne({ where: { id: absence.id } });
    check('absence justified after admin approval', absenceAfter?.justified === true);

    const history = await agentAdminA.get(`/api/${schoolA.slug}/ai/documents/${docId}/history`);
    check('lifecycle history exists', history.status === 200 && history.body.data.length >= 3, history.body);
    const historyActions = history.body.data.map((r: { action: string }) => r.action);
    check('history contains upload/confirm/approve', ['uploaded', 'confirmed', 'approved'].every((a) => historyActions.includes(a)), historyActions);

    const upload2 = await agentParentA.post(`/api/${schoolA.slug}/ai/documents/scan`)
      .set('X-CSRF-Token', csrfParentA)
      .field('studentId', studentA.id)
      .field('documentType', 'medical_certificate')
      .attach('file', PNG_BYTES_2, { filename: 'cert2.png', contentType: 'image/png' });
    const doc2Id: string = upload2.body.data.id;
    const overlapApprove = await agentAdminA.post(`/api/${schoolA.slug}/ai/documents/${doc2Id}/review`)
      .set('X-CSRF-Token', csrfAdminA)
      .send({ decision: 'approved', startDate: absenceDate, endDate: absenceDate });
    check('overlapping second approval -> 409', overlapApprove.status === 409, overlapApprove.body);

    const teacherDownload = await agentTeacherA.get(`/api/${schoolA.slug}/ai/documents/${docId}/file`);
    check('teacher cannot download raw medical document -> 403', teacherDownload.status === 403, teacherDownload.status);

    const adminPreview = await agentAdminA.get(`/api/${schoolA.slug}/ai/documents/${docId}/preview`);
    check('school admin can open document inline (preview) -> 200', adminPreview.status === 200, adminPreview.status);
    check('preview is inline, not a download', (adminPreview.headers['content-disposition'] || '').startsWith('inline'), adminPreview.headers['content-disposition']);
    const teacherPreview = await agentTeacherA.get(`/api/${schoolA.slug}/ai/documents/${docId}/preview`);
    check('teacher cannot preview raw medical document -> 403', teacherPreview.status === 403, teacherPreview.status);
    const parentPreview = await agentParentA.get(`/api/${schoolA.slug}/ai/documents/${docId}/preview`);
    check('parent cannot use admin preview -> 403', parentPreview.status === 403, parentPreview.status);
    const crossSchoolPreview = await agentAdminA.get(`/api/${schoolB.slug}/ai/documents/${docId}/preview`);
    check('admin cannot preview another school document -> 403/404', [403, 404].includes(crossSchoolPreview.status), crossSchoolPreview.status);

    // ---------- intelligence endpoints ----------
    console.log('intelligence endpoints');
    for (const [name, url] of [
      ['finance', `/api/${schoolA.slug}/ai/finance`],
      ['curriculum', `/api/${schoolA.slug}/ai/curriculum`],
      ['notification intelligence', `/api/${schoolA.slug}/ai/notifications/intelligence`],
    ] as Array<[string, string]>) {
      const res = await agentAdminA.get(url);
      check(`admin ${name} -> 200`, res.status === 200, res.status);
      const parentRes = await agentParentA.get(url);
      check(`parent ${name} -> 403`, parentRes.status === 403, parentRes.status);
    }

    const trends = await agentSuper.get('/api/super-admin/ai/trends');
    check('super admin trends -> 200 with months', trends.status === 200 && Array.isArray(trends.body.data.months), trends.status);
    const trendsForbidden = await agentAdminA.get('/api/super-admin/ai/trends');
    check('school admin trends -> 403', trendsForbidden.status === 403, trendsForbidden.status);

    // ---------- cookie session lifecycle ----------
    console.log('cookie session lifecycle');
    const refreshed = await agentParentA.post('/api/auth/refresh').set('X-CSRF-Token', csrfParentA).send({});
    check('refresh via HttpOnly cookie -> 200, still no tokens in JSON', refreshed.status === 200 && refreshed.body.data.accessToken === undefined, refreshed.body);
    check('refresh rotates cookies', setCookies(refreshed).includes('access_token='), setCookies(refreshed));

    const staleBearer = await api.get(`/api/${schoolA.slug}/students/${studentA.id}`)
      .set('Authorization', `Bearer ${accessCookieParentA}`);
    check('captured access token works before password change', staleBearer.status === 200, staleBearer.status);

    const csrfAfterRefresh = cookieValue(refreshed, 'csrf_token') || csrfParentA;
    const pwChange = await agentParentA.put('/api/auth/update-profile')
      .set('X-CSRF-Token', csrfAfterRefresh)
      .send({ currentPassword: 'Passw0rd12345', newPassword: 'NewPassw0rd123' });
    check('parent changes password', pwChange.status === 200, pwChange.body);

    const revoked = await api.get(`/api/${schoolA.slug}/students/${studentA.id}`)
      .set('Authorization', `Bearer ${accessCookieParentA}`);
    check('old token revoked after password change (tokenVersion) -> 401', revoked.status === 401, revoked.status);

    const relogin = await request.agent(app).post(`/api/auth/school/${schoolA.slug}/login`)
      .send({ phone: '1000000003', password: 'NewPassw0rd123' });
    check('login with new password works', relogin.status === 200, relogin.status);
    void accessCookieAdminA;

    console.log(`\nAPI integration/E2E: ${passed} checks passed`);
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error('API integration/E2E FAILED:', error);
  process.exit(1);
});
