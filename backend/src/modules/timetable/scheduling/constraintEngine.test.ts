import assert from 'node:assert';
import { constraintEngine, type SchedulingContext, type SlotSnapshot } from './constraintEngine';
import { optimizationEngine } from './optimizationEngine';

function slot(partial: Partial<SlotSnapshot>): SlotSnapshot {
  return {
    id: 'slot-1',
    teacherId: 'teacher-1',
    classroomId: 'room-1',
    courseId: 'course-1',
    day: 'sunday',
    periodId: 'p1',
    startTime: '08:00',
    duration: 60,
    ...partial,
  };
}

function ctx(partial: Partial<SchedulingContext> = {}): SchedulingContext {
  return {
    schoolId: 'school-1',
    slot: slot({}),
    studyDays: ['sunday', 'monday'],
    periods: [
      { id: 'p1', label: 'P1', startTime: '08:00', endTime: '09:00' },
      { id: 'p2', label: 'P2', startTime: '09:15', endTime: '10:15' },
    ],
    allSlots: [slot({})],
    affectedStudentIds: ['student-1'],
    studentSlotIds: [],
    classroom: { id: 'room-1', capacity: 30, enrolledCount: 20 },
    course: { id: 'course-1', capacity: 30, enrolledCount: 10 },
    ...partial,
  };
}

const codes = (c: SchedulingContext, day: string, periodId: string) =>
  constraintEngine.evaluate(c, { day, periodId }).violations.map((v) => v.code);

assert.strictEqual(constraintEngine.evaluate(ctx(), { day: 'monday', periodId: 'p2' }).feasible, true);

assert.ok(
  codes(
    ctx({ allSlots: [slot({}), slot({ id: 'other', day: 'monday', periodId: 'x', startTime: '09:30', duration: 60 })] }),
    'monday',
    'p2',
  ).includes('TEACHER_CONFLICT'),
  'time-overlap (not just same periodId) must be a teacher conflict',
);

assert.ok(codes(ctx(), 'tuesday', 'p1').includes('DAY_NOT_STUDY_DAY'));
assert.ok(codes(ctx(), 'monday', 'missing').includes('PERIOD_NOT_FOUND'));
assert.ok(
  codes(ctx({ slot: slot({ duration: 90 }) }), 'monday', 'p2').includes('DURATION_EXCEEDS_PERIOD'),
);
assert.ok(
  codes(ctx({ classroom: { id: 'room-1', capacity: 10, enrolledCount: 20 } }), 'monday', 'p2').includes(
    'CLASSROOM_CAPACITY_EXCEEDED',
  ),
);
assert.ok(
  codes(
    ctx({
      studentSlotIds: ['other'],
      allSlots: [slot({}), slot({ id: 'other', teacherId: 't2', classroomId: 'r2', courseId: 'c2', startTime: '08:00' })],
    }),
    'sunday',
    'p1',
  ).includes('STUDENT_CONFLICT'),
);

const conflictingCtx = ctx({
  allSlots: [slot({}), slot({ id: 'other', day: 'monday', periodId: 'p2', startTime: '09:15' })],
});
const alternatives = optimizationEngine.findAlternatives(conflictingCtx, { day: 'monday', periodId: 'p2' });
assert.ok(alternatives.length > 0, 'optimizer should propose alternatives');
for (const alt of alternatives) {
  assert.strictEqual(
    constraintEngine.evaluate(conflictingCtx, { day: alt.day, periodId: alt.periodId }).feasible,
    true,
    'every suggested alternative must pass the constraint engine',
  );
  assert.notStrictEqual(`${alt.day}:${alt.periodId}`, 'monday:p2');
}

console.log('scheduling constraint/optimization tests passed');
