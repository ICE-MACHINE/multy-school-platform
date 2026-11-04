import type { PlatformSnapshot, SchoolSnapshot } from './platformSnapshot';

export interface SchoolCollectionsComparison {
  schoolId: string;
  schoolName: string;
  currentMonth: number;
  previousMonth: number;
  delta: number;
  deltaPct: number | null;
}

export interface ChurnRisk {
  schoolId: string;
  schoolName: string;
  score: number;
  level: 'high' | 'medium' | 'low';
  reasonCodes: string[];
}

export interface PlanRecommendation {
  schoolId: string;
  schoolName: string;
  userUsagePct: number;
  messageUsagePct: number;
  currentUsers: number;
  maxUsers: number;
  suggestedMaxUsers: number;
  currentMessages: number;
  maxMessages: number;
  suggestedMaxMessages: number;
  basisCodes: string[];
}

export interface ContactAction {
  schoolId: string;
  schoolName: string;
  urgencyScore: number;
  actionCodes: string[];
  reasonCodes: string[];
}

export interface DiagnosisDriver {
  code: string;
  schoolId?: string;
  schoolName?: string;
  current?: number;
  previous?: number;
  deltaPct?: number | null;
  schools?: string[];
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100;
}

function ageDays(school: SchoolSnapshot, nowMs: number): number {
  const created = new Date(school.createdAt).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.floor((nowMs - created) / (24 * 60 * 60 * 1000));
}

export function buildChurnRisks(
  snapshot: PlatformSnapshot,
  now: Date = new Date(snapshot.generatedAt),
): ChurnRisk[] {
  const nowMs = now.getTime() || Date.now();
  const risks: ChurnRisk[] = [];

  for (const school of snapshot.schools) {
    let score = 0;
    const reasonCodes: string[] = [];
    const age = ageDays(school, nowMs);

    if (!school.isActive) {
      score += 45;
      reasonCodes.push('inactive');
    }
    if (school.isFrozen) {
      score += 35;
      reasonCodes.push('frozen');
    }
    if (age > 14 && school.students === 0) {
      score += 30;
      reasonCodes.push('no_students_after_14d');
    }
    if (age > 14 && school.teachers === 0) {
      score += 20;
      reasonCodes.push('no_teachers_after_14d');
    }
    if (school.isActive && !school.isFrozen && !school.hasPaymentThisMonth) {
      score += 15;
      reasonCodes.push('no_collections_this_month');
    }
    if (age > 30 && school.students > 0 && school.students < 5) {
      score += 10;
      reasonCodes.push('very_low_adoption');
    }

    if (score >= 30) {
      const capped = Math.min(100, score);
      risks.push({
        schoolId: school.id,
        schoolName: school.name,
        score: capped,
        level: capped >= 60 ? 'high' : capped >= 40 ? 'medium' : 'low',
        reasonCodes,
      });
    }
  }

  return risks.sort((a, b) => b.score - a.score).slice(0, 10);
}

function suggestedLimit(current: number, max: number, usagePct: number): number {
  if (usagePct < 80) return max;
  const target = Math.ceil(current / 0.6);
  const rounded = Math.ceil(target / 10) * 10;
  return Math.max(max, rounded || max);
}

export function buildPlanRecommendations(snapshot: PlatformSnapshot): PlanRecommendation[] {
  return snapshot.schools
    .filter((s) => s.userUsagePct >= 80 || s.messageUsagePct >= 80)
    .map((s) => {
      const basisCodes: string[] = [];
      if (s.userUsagePct >= 80) basisCodes.push('user_quota_above_80');
      if (s.messageUsagePct >= 80) basisCodes.push('message_quota_above_80');
      if (s.userUsagePct >= 90 || s.messageUsagePct >= 90) basisCodes.push('near_hard_limit');
      return {
        schoolId: s.id,
        schoolName: s.name,
        userUsagePct: s.userUsagePct,
        messageUsagePct: s.messageUsagePct,
        currentUsers: s.currentUsers,
        maxUsers: s.maxUsers,
        suggestedMaxUsers: suggestedLimit(s.currentUsers, s.maxUsers, s.userUsagePct),
        currentMessages: s.currentMessages,
        maxMessages: s.maxMessages,
        suggestedMaxMessages: suggestedLimit(s.currentMessages, s.maxMessages, s.messageUsagePct),
        basisCodes,
      };
    })
    .sort(
      (a, b) =>
        Math.max(b.userUsagePct, b.messageUsagePct) - Math.max(a.userUsagePct, a.messageUsagePct),
    )
    .slice(0, 10);
}

export function buildContactToday(
  snapshot: PlatformSnapshot,
  churnRisks: ChurnRisk[] = buildChurnRisks(snapshot),
): ContactAction[] {
  const bySchool = new Map<string, ContactAction>();
  const upsert = (
    school: { id: string; name: string },
    urgency: number,
    action: string,
    reasons: string[],
  ) => {
    const existing = bySchool.get(school.id);
    if (existing) {
      existing.urgencyScore = Math.max(existing.urgencyScore, urgency);
      if (!existing.actionCodes.includes(action)) existing.actionCodes.push(action);
      for (const r of reasons) if (!existing.reasonCodes.includes(r)) existing.reasonCodes.push(r);
    } else {
      bySchool.set(school.id, {
        schoolId: school.id,
        schoolName: school.name,
        urgencyScore: urgency,
        actionCodes: [action],
        reasonCodes: [...reasons],
      });
    }
  };

  for (const risk of churnRisks) {
    upsert(
      { id: risk.schoolId, name: risk.schoolName },
      risk.score,
      'contact_school',
      risk.reasonCodes,
    );
  }
  for (const school of snapshot.schools) {
    if (school.userUsagePct >= 90 || school.messageUsagePct >= 90) {
      upsert(school, Math.max(school.userUsagePct, school.messageUsagePct), 'propose_quota_upgrade', [
        'near_quota_limit',
      ]);
    } else if (school.userUsagePct >= 80 || school.messageUsagePct >= 80) {
      upsert(school, 70, 'propose_quota_upgrade', ['quota_above_80']);
    }
    if (school.isFrozen) {
      upsert(school, 75, 'follow_up_frozen', ['frozen']);
    }
    if (school.isActive && !school.isFrozen && !school.hasPaymentThisMonth && school.monthlyFee > 0) {
      const existing = bySchool.get(school.id);
      if (!existing) upsert(school, 55, 'check_collections_activity', ['no_collections_this_month']);
    }
  }

  return [...bySchool.values()].sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 10);
}

export function diagnoseCollections(input: {
  collectionsCurrent: number;
  collectionsPrevious: number;
  paymentCountCurrent: number;
  paymentCountPrevious: number;
  refundsCurrent: number;
  refundsPrevious: number;
  perSchool: SchoolCollectionsComparison[];
  newSchoolsCurrent: number;
  newSchoolsPrevious: number;
  frozenSchools: number;
  inactiveSchools: number;
}): DiagnosisDriver[] {
  const drivers: DiagnosisDriver[] = [];

  const zeroed = input.perSchool.filter((s) => s.previousMonth > 0 && s.currentMonth === 0);
  if (zeroed.length > 0) {
    drivers.push({
      code: 'schools_dropped_to_zero_collections',
      current: 0,
      previous: zeroed.reduce((sum, s) => sum + s.previousMonth, 0),
      schools: zeroed.slice(0, 5).map((s) => s.schoolName),
    });
  }

  const declining = input.perSchool
    .filter((s) => s.previousMonth > 0 && s.delta < 0 && s.currentMonth > 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);
  for (const s of declining) {
    drivers.push({
      code: 'school_collections_declined',
      schoolId: s.schoolId,
      schoolName: s.schoolName,
      current: s.currentMonth,
      previous: s.previousMonth,
      deltaPct: s.deltaPct,
    });
  }

  const countDeltaPct = pctChange(input.paymentCountCurrent, input.paymentCountPrevious);
  if (countDeltaPct !== null && Math.abs(countDeltaPct) >= 10) {
    drivers.push({
      code: 'payment_count_changed',
      current: input.paymentCountCurrent,
      previous: input.paymentCountPrevious,
      deltaPct: countDeltaPct,
    });
  }

  if (input.refundsCurrent > input.refundsPrevious && input.refundsCurrent > 0) {
    drivers.push({
      code: 'refunds_increased',
      current: input.refundsCurrent,
      previous: input.refundsPrevious,
      deltaPct: pctChange(input.refundsCurrent, input.refundsPrevious),
    });
  }

  if (input.newSchoolsCurrent !== input.newSchoolsPrevious) {
    drivers.push({
      code: 'new_school_signups_changed',
      current: input.newSchoolsCurrent,
      previous: input.newSchoolsPrevious,
      deltaPct: pctChange(input.newSchoolsCurrent, input.newSchoolsPrevious),
    });
  }

  if (input.frozenSchools > 0) {
    drivers.push({ code: 'frozen_schools_current_state', current: input.frozenSchools });
  }
  if (input.inactiveSchools > 0) {
    drivers.push({ code: 'inactive_schools_current_state', current: input.inactiveSchools });
  }

  return drivers;
}
