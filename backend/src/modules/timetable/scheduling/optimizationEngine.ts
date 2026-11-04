import {
  ConstraintEngine,
  constraintEngine,
  timeToMinutes,
  type SchedulingContext,
  type TargetSlot,
} from './constraintEngine';

export interface SuggestedAlternative {
  day: string;
  periodId: string;
  periodLabel: string;
  startTime: string;
  endTime: string;
  score: number;
  reasonCodes: string[];
}

export class OptimizationEngine {
  constructor(private readonly constraints: ConstraintEngine = constraintEngine) {}

  findAlternatives(
    ctx: SchedulingContext,
    requested: Partial<TargetSlot>,
    limit = 5,
  ): SuggestedAlternative[] {
    const days = ctx.studyDays.length > 0 ? ctx.studyDays : [...new Set(ctx.allSlots.map((s) => s.day))];
    const requestedDayIndex = requested.day ? days.indexOf(requested.day) : -1;
    const requestedPeriod = requested.periodId
      ? ctx.periods.find((p) => p.id === requested.periodId)
      : undefined;
    const requestedStart = requestedPeriod ? timeToMinutes(requestedPeriod.startTime) : null;

    const candidates: SuggestedAlternative[] = [];

    for (const day of days) {
      for (const period of ctx.periods) {
        if (day === ctx.slot.day && period.id === ctx.slot.periodId) continue;
        if (day === requested.day && period.id === requested.periodId) continue;

        const evaluation = this.constraints.evaluate(ctx, { day, periodId: period.id });
        if (!evaluation.feasible || !evaluation.target) continue;

        const reasonCodes: string[] = [];
        let score = 100;

        const dayDistance = requestedDayIndex >= 0 ? Math.abs(days.indexOf(day) - requestedDayIndex) : 0;
        if (dayDistance === 0) reasonCodes.push('same_day');
        score -= dayDistance * 8;

        if (requestedStart !== null) {
          const minutesAway = Math.abs(timeToMinutes(period.startTime) - requestedStart);
          if (minutesAway <= 60) reasonCodes.push('closest_time');
          score -= Math.min(30, Math.floor(minutesAway / 15));
        }

        const teacherLoadThatDay = ctx.allSlots.filter(
          (s) => s.id !== ctx.slot.id && s.day === day && s.teacherId === ctx.slot.teacherId,
        ).length;
        if (teacherLoadThatDay <= 1) reasonCodes.push('low_teacher_load');
        score -= teacherLoadThatDay * 3;

        const gaps = ctx.allSlots
          .filter((s) => s.id !== ctx.slot.id && s.day === day && s.teacherId === ctx.slot.teacherId)
          .map((s) => Math.abs(timeToMinutes(s.startTime) - timeToMinutes(period.startTime)));
        if (gaps.length > 0 && Math.min(...gaps) >= 120) reasonCodes.push('avoids_back_to_back');
        if (gaps.length === 0) reasonCodes.push('free_day_for_teacher');

        candidates.push({
          day,
          periodId: period.id,
          periodLabel: evaluation.target.periodLabel,
          startTime: evaluation.target.startTime,
          endTime: evaluation.target.endTime,
          score: Math.max(0, Math.round(score)),
          reasonCodes,
        });
      }
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, Math.max(0, limit));
  }
}

export const optimizationEngine = new OptimizationEngine();
