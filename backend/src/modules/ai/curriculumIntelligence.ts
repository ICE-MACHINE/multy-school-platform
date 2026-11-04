export interface CourseProgressInput {
  courseId: string;
  courseName: string;
  teacherId: string | null;
  teacherName: string | null;
  totalLessons: number;
  taughtLessons: number;
  untaughtLessonTitles: string[];
  plannedSessions: number | null;
  completedSessions: number;
  sessionsLast28Days: number;
  lastSessionDate: string | null;
  startDate: string | null;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  teacherId: string | null;
  teacherName: string | null;
  totalLessons: number;
  taughtLessons: number;
  remainingLessons: number;
  progressPct: number;
  plannedSessions: number | null;
  completedSessions: number;
  sessionProgressPct: number | null;
  sessionsPerWeek: number;
  daysSinceLastSession: number | null;
  projectedCompletionDate: string | null;
  mayMissYearEnd: boolean;
  riskLevel: 'high' | 'medium' | 'low';
  riskCodes: string[];
  untaughtLessonTitles: string[];
}

export interface CurriculumIntelligence {
  courses: CourseProgress[];
  teachers: Array<{
    teacherId: string | null;
    teacherName: string | null;
    courses: number;
    averageProgressPct: number;
    highRiskCourses: number;
  }>;
  atRiskCourses: CourseProgress[];
  academicYearEnd: string | null;
  generatedAt: string;
}

function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 10000) / 100;
}

export function computeCourseProgress(
  input: CourseProgressInput,
  now: Date = new Date(),
  academicYearEnd?: string,
): CourseProgress {
  const remainingLessons = Math.max(0, input.totalLessons - input.taughtLessons);
  const progressPct = pct(input.taughtLessons, input.totalLessons);
  const sessionProgressPct =
    input.plannedSessions && input.plannedSessions > 0
      ? pct(input.completedSessions, input.plannedSessions)
      : null;
  const sessionsPerWeek = Math.round((input.sessionsLast28Days / 4) * 100) / 100;

  const daysSinceLastSession = input.lastSessionDate
    ? Math.floor((now.getTime() - new Date(input.lastSessionDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const remainingWork =
    input.plannedSessions && input.plannedSessions > 0
      ? Math.max(0, input.plannedSessions - input.completedSessions)
      : remainingLessons;

  let projectedCompletionDate: string | null = null;
  if (remainingWork === 0) {
    projectedCompletionDate = now.toISOString().slice(0, 10);
  } else if (sessionsPerWeek > 0) {
    const weeksNeeded = remainingWork / sessionsPerWeek;
    projectedCompletionDate = new Date(now.getTime() + weeksNeeded * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  const mayMissYearEnd = Boolean(
    academicYearEnd && projectedCompletionDate && projectedCompletionDate > academicYearEnd,
  );

  const riskCodes: string[] = [];
  if (remainingWork > 0 && sessionsPerWeek === 0) riskCodes.push('no_recent_sessions_velocity_zero');
  if (daysSinceLastSession !== null && daysSinceLastSession > 14 && remainingWork > 0) {
    riskCodes.push('stale_no_session_for_over_14_days');
  }
  if (input.lastSessionDate === null && remainingWork > 0 && input.startDate) {
    const startAgeDays = Math.floor((now.getTime() - new Date(input.startDate).getTime()) / 86400000);
    if (startAgeDays > 14) riskCodes.push('course_started_without_any_completed_session');
  }
  if (sessionProgressPct !== null && progressPct + 20 < sessionProgressPct) {
    riskCodes.push('lessons_taught_lag_sessions');
  }
  if (mayMissYearEnd) riskCodes.push('projected_completion_after_year_end');

  const riskLevel: CourseProgress['riskLevel'] = mayMissYearEnd || riskCodes.includes('no_recent_sessions_velocity_zero') && remainingWork > 0
    ? 'high'
    : riskCodes.length > 0
      ? 'medium'
      : 'low';

  return {
    courseId: input.courseId,
    courseName: input.courseName,
    teacherId: input.teacherId,
    teacherName: input.teacherName,
    totalLessons: input.totalLessons,
    taughtLessons: input.taughtLessons,
    remainingLessons,
    progressPct,
    plannedSessions: input.plannedSessions,
    completedSessions: input.completedSessions,
    sessionProgressPct,
    sessionsPerWeek,
    daysSinceLastSession,
    projectedCompletionDate,
    mayMissYearEnd,
    riskLevel,
    riskCodes,
    untaughtLessonTitles: input.untaughtLessonTitles.slice(0, 20),
  };
}

export function computeCurriculumIntelligence(
  inputs: CourseProgressInput[],
  now: Date = new Date(),
  academicYearEnd?: string,
): CurriculumIntelligence {
  const courses = inputs
    .map((input) => computeCourseProgress(input, now, academicYearEnd))
    .sort((a, b) => a.progressPct - b.progressPct);

  const byTeacher = new Map<string, { teacherId: string | null; teacherName: string | null; items: CourseProgress[] }>();
  for (const course of courses) {
    const key = course.teacherId || 'unassigned';
    const existing = byTeacher.get(key) || {
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      items: [],
    };
    existing.items.push(course);
    byTeacher.set(key, existing);
  }

  return {
    courses,
    teachers: [...byTeacher.values()]
      .map((group) => ({
        teacherId: group.teacherId,
        teacherName: group.teacherName,
        courses: group.items.length,
        averageProgressPct:
          group.items.length > 0
            ? Math.round((group.items.reduce((sum, c) => sum + c.progressPct, 0) / group.items.length) * 100) / 100
            : 0,
        highRiskCourses: group.items.filter((c) => c.riskLevel === 'high').length,
      }))
      .sort((a, b) => a.averageProgressPct - b.averageProgressPct),
    atRiskCourses: courses.filter((c) => c.riskLevel !== 'low'),
    academicYearEnd: academicYearEnd || null,
    generatedAt: now.toISOString(),
  };
}
