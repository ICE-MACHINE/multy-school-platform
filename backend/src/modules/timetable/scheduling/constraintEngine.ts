import type { TimePeriod } from '../timetableSettings.entity';

export type HardConstraintCode =
  | 'NO_TARGET'
  | 'INVALID_DURATION'
  | 'DAY_NOT_STUDY_DAY'
  | 'PERIOD_NOT_FOUND'
  | 'OUTSIDE_OPERATING_HOURS'
  | 'DURATION_EXCEEDS_PERIOD'
  | 'TEACHER_CONFLICT'
  | 'CLASSROOM_CONFLICT'
  | 'COURSE_GROUP_CONFLICT'
  | 'STUDENT_CONFLICT'
  | 'CLASSROOM_CAPACITY_EXCEEDED'
  | 'COURSE_CAPACITY_EXCEEDED';

export interface ConstraintViolation {
  code: HardConstraintCode;
  message: string;
  details?: Record<string, string | number>;
}

export interface SlotSnapshot {
  id: string;
  teacherId: string | null;
  classroomId: string | null;
  courseId: string | null;
  day: string;
  periodId: string | null;
  startTime: string;
  duration: number;
}

export interface CapacityInfo {
  id: string;
  capacity: number;
  enrolledCount: number;
}

export interface SchedulingContext {
  schoolId: string;
  slot: SlotSnapshot;
  studyDays: string[];
  periods: TimePeriod[];
  allSlots: SlotSnapshot[];
  affectedStudentIds: string[];
  studentSlotIds: string[];
  classroom: CapacityInfo | null;
  course: CapacityInfo | null;
}

export interface TargetSlot {
  day: string;
  periodId: string;
  startTime?: string;
}

export interface ResolvedTarget extends TargetSlot {
  periodLabel: string;
  startTime: string;
  endTime: string;
}

export interface ConstraintEvaluation {
  feasible: boolean;
  violations: ConstraintViolation[];
  target: ResolvedTarget | null;
  checkedConstraints: string[];
}

export const CHECKED_CONSTRAINTS = [
  'study_day',
  'operating_hours',
  'period_fit',
  'teacher_overlap',
  'classroom_overlap',
  'course_group_overlap',
  'student_overlap',
  'classroom_capacity',
  'course_capacity',
] as const;

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export class ConstraintEngine {
  evaluate(ctx: SchedulingContext, target: Partial<TargetSlot>): ConstraintEvaluation {
    const violations: ConstraintViolation[] = [];
    const slot = ctx.slot;

    if (!target.day || !target.periodId) {
      violations.push({
        code: 'NO_TARGET',
        message: 'No requested day/period was provided; there is no target slot to validate.',
      });
      return { feasible: false, violations, target: null, checkedConstraints: [...CHECKED_CONSTRAINTS] };
    }

    if (!Number.isFinite(slot.duration) || slot.duration <= 0) {
      violations.push({
        code: 'INVALID_DURATION',
        message: `Slot duration (${slot.duration}) is not a positive number of minutes.`,
      });
    }

    if (ctx.studyDays.length > 0 && !ctx.studyDays.includes(target.day)) {
      violations.push({
        code: 'DAY_NOT_STUDY_DAY',
        message: `"${target.day}" is not one of the institution's study days.`,
        details: { day: target.day },
      });
    }

    const period = ctx.periods.find((p) => p.id === target.periodId);
    if (!period) {
      violations.push({
        code: 'PERIOD_NOT_FOUND',
        message: `Requested period "${target.periodId}" does not exist in the timetable settings.`,
        details: { periodId: target.periodId },
      });
      return { feasible: false, violations, target: null, checkedConstraints: [...CHECKED_CONSTRAINTS] };
    }

    const periodStartMin = timeToMinutes(period.startTime);
    const startMin = target.startTime ? timeToMinutes(target.startTime) : periodStartMin;
    const periodEndMin = timeToMinutes(period.endTime);
    const endMin = startMin + slot.duration;
    const resolved: ResolvedTarget = {
      day: target.day,
      periodId: period.id,
      periodLabel: period.label,
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
    };
    if (startMin < periodStartMin || startMin >= periodEndMin) {
      violations.push({
        code: 'OUTSIDE_OPERATING_HOURS',
        message: `Target start ${resolved.startTime} is outside period "${period.label}" (${period.startTime}-${period.endTime}).`,
      });
    }

    if (ctx.periods.length > 0) {
      const operatingStart = Math.min(...ctx.periods.map((p) => timeToMinutes(p.startTime)));
      const operatingEnd = Math.max(...ctx.periods.map((p) => timeToMinutes(p.endTime)));
      if (startMin < operatingStart || endMin > operatingEnd) {
        violations.push({
          code: 'OUTSIDE_OPERATING_HOURS',
          message: `Target time ${resolved.startTime}-${resolved.endTime} is outside operating hours ${minutesToTime(operatingStart)}-${minutesToTime(operatingEnd)}.`,
        });
      }
    }

    if (endMin > periodEndMin) {
      violations.push({
        code: 'DURATION_EXCEEDS_PERIOD',
        message: `Slot duration (${slot.duration} min) does not fit period "${period.label}" (${period.startTime}-${period.endTime}); the inter-period break would be consumed.`,
        details: { duration: slot.duration, periodId: period.id },
      });
    }

    const studentSlotIdSet = new Set(ctx.studentSlotIds);
    const seen = new Set<HardConstraintCode>();
    const pushOnce = (v: ConstraintViolation) => {
      if (seen.has(v.code)) return;
      seen.add(v.code);
      violations.push(v);
    };

    for (const other of ctx.allSlots) {
      if (other.id === slot.id || other.day !== target.day) continue;
      const otherStart = timeToMinutes(other.startTime);
      const otherEnd = otherStart + (other.duration || 0);
      if (!intervalsOverlap(startMin, endMin, otherStart, otherEnd)) continue;

      if (slot.teacherId && other.teacherId === slot.teacherId) {
        pushOnce({
          code: 'TEACHER_CONFLICT',
          message: 'Teacher already teaches another slot overlapping the requested time.',
          details: { conflictingSlotId: other.id, startTime: other.startTime },
        });
      }
      if (slot.classroomId && other.classroomId === slot.classroomId) {
        pushOnce({
          code: 'CLASSROOM_CONFLICT',
          message: 'Classroom is already assigned to another slot overlapping the requested time.',
          details: { conflictingSlotId: other.id, startTime: other.startTime },
        });
      }
      if (slot.courseId && other.courseId === slot.courseId) {
        pushOnce({
          code: 'COURSE_GROUP_CONFLICT',
          message: 'The same course/group already has a slot overlapping the requested time.',
          details: { conflictingSlotId: other.id, startTime: other.startTime },
        });
      }
      if (studentSlotIdSet.has(other.id)) {
        pushOnce({
          code: 'STUDENT_CONFLICT',
          message: 'Students of this slot already attend another slot overlapping the requested time.',
          details: {
            conflictingSlotId: other.id,
            startTime: other.startTime,
            affectedStudents: ctx.affectedStudentIds.length,
          },
        });
      }
    }

    if (ctx.classroom && ctx.classroom.enrolledCount > ctx.classroom.capacity) {
      violations.push({
        code: 'CLASSROOM_CAPACITY_EXCEEDED',
        message: `Classroom capacity (${ctx.classroom.capacity}) is exceeded by enrolled students (${ctx.classroom.enrolledCount}).`,
        details: { capacity: ctx.classroom.capacity, enrolled: ctx.classroom.enrolledCount },
      });
    }
    if (ctx.course && ctx.course.enrolledCount > ctx.course.capacity) {
      violations.push({
        code: 'COURSE_CAPACITY_EXCEEDED',
        message: `Course capacity (${ctx.course.capacity}) is exceeded by enrolled students (${ctx.course.enrolledCount}).`,
        details: { capacity: ctx.course.capacity, enrolled: ctx.course.enrolledCount },
      });
    }

    return {
      feasible: violations.length === 0,
      violations,
      target: resolved,
      checkedConstraints: [...CHECKED_CONSTRAINTS],
    };
  }
}

export const constraintEngine = new ConstraintEngine();
