import { IsNull } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import { Notification } from '../notification/notification.entity';
import {
  ScheduleChangeRequest,
  type AgentTraceStep,
} from '../timetable/scheduleChangeRequest.entity';
import { TimetableSlot } from '../timetable/timetableSlot.entity';
import { ApiError } from '../../shared/utils/ApiError';
import { chatJson, isMetaAiEnabled } from './metaAi.client';
import {
  constraintEngine,
  type ConstraintEvaluation,
} from '../timetable/scheduling/constraintEngine';
import { optimizationEngine, type SuggestedAlternative } from '../timetable/scheduling/optimizationEngine';
import { loadSchedulingContext } from '../timetable/scheduling/schedulingContext';

type AiDecision = 'approve' | 'reject' | 'manual_review';

interface MetaAdvisoryResponse {
  recommendation?: unknown;
  confidence?: unknown;
  summary?: unknown;
}

interface Advisory {
  recommendation: AiDecision;
  confidence: number;
  summary: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isDecision(value: unknown): value is AiDecision {
  return value === 'approve' || value === 'reject' || value === 'manual_review';
}

function deterministicDecision(
  evaluation: ConstraintEvaluation,
  alternatives: SuggestedAlternative[],
): { decision: AiDecision; reason: string } {
  if (evaluation.feasible && evaluation.target) {
    return {
      decision: 'approve',
      reason:
        `All hard constraints passed (${evaluation.checkedConstraints.join(', ')}). ` +
        `Target ${evaluation.target.day} ${evaluation.target.startTime}-${evaluation.target.endTime} is feasible.`,
    };
  }
  const codes = evaluation.violations.map((v) => v.code).join(', ') || 'UNKNOWN';
  if (alternatives.length > 0) {
    return {
      decision: 'manual_review',
      reason:
        `Hard constraint violation(s): ${codes}. The requested slot cannot be applied; ` +
        `${alternatives.length} feasible alternative(s) were found for admin review.`,
    };
  }
  return {
    decision: 'reject',
    reason: `Hard constraint violation(s): ${codes}. No feasible alternative slot was found.`,
  };
}

export class ScheduleAutomationService {
  constructor(
    private readonly requestRepo = AppDataSource.getRepository(ScheduleChangeRequest),
    private readonly slotRepo = AppDataSource.getRepository(TimetableSlot),
    private readonly notifRepo = AppDataSource.getRepository(Notification),
  ) {}

  private async notifyTeacher(
    schoolId: string,
    teacherId: string,
    title: string,
    message: string,
  ): Promise<void> {
    const id = crypto.randomUUID();
    await this.notifRepo.query(
      'INSERT INTO notifications (id, title, message, type, recipientId, recipientRole, schoolId, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, message, 'schedule_change', teacherId, 'teacher', schoolId, '/teacher/timetable'],
    );
  }

  async evaluate(
    schoolId: string,
    requestId: string,
    options: { applyIfApproved: boolean },
  ): Promise<ScheduleChangeRequest> {
    const trace: AgentTraceStep[] = [];
    const record = (
      tool: string,
      permission: AgentTraceStep['permission'],
      status: AgentTraceStep['status'],
      summary: string,
      startedAt: number,
    ) => {
      trace.push({
        step: trace.length + 1,
        tool,
        permission,
        status,
        summary,
        at: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - startedAt),
      });
    };

    let started = Date.now();
    const request = await this.requestRepo.findOne({
      where: { id: requestId, schoolId },
      relations: ['slot'],
    });
    if (!request) throw ApiError.notFound('Schedule change request not found');

    const slot = request.slotId
      ? await this.slotRepo.findOne({ where: { id: request.slotId, schoolId } })
      : request.slot || null;
    record(
      'load_scheduling_context',
      'read:timetable',
      slot ? 'ok' : 'failed',
      slot ? `Loaded request and slot ${slot.id} (day=${slot.day}, period=${slot.periodId}).` : 'Timetable slot not found.',
      started,
    );

    if (!slot) {
      request.aiDecision = 'manual_review';
      request.aiConfidence = 1;
      request.aiReason = 'Hard constraint violation(s): NO_TARGET. Timetable slot not found for this request.';
      request.constraintFeasible = false;
      request.constraintViolations = [
        { code: 'NO_TARGET', message: 'Timetable slot not found for this request; manual review is required.' },
      ];
      request.suggestedAlternatives = [];
      request.agentRecommendation = null;
      request.agentSummary = null;
      request.agentTrace = trace;
      request.aiProcessedAt = new Date();
      return this.requestRepo.save(request);
    }

    const targetDay = request.requestedDay || slot.day;
    const targetPeriodId = request.requestedPeriodId || slot.periodId;

    started = Date.now();
    const ctx = await loadSchedulingContext(schoolId, slot);
    record(
      'load_scheduling_context',
      'read:timetable',
      'ok',
      `Context loaded: ${ctx.allSlots.length} slots, ${ctx.affectedStudentIds.length} affected students, ${ctx.periods.length} periods.`,
      started,
    );

    started = Date.now();
    const evaluation = constraintEngine.evaluate(ctx, { day: targetDay, periodId: targetPeriodId });
    record(
      'constraint_engine.evaluate',
      'compute:local',
      'ok',
      evaluation.feasible
        ? `Feasible. Checked: ${evaluation.checkedConstraints.join(', ')}.`
        : `Infeasible: ${evaluation.violations.map((v) => v.code).join(', ')}.`,
      started,
    );

    started = Date.now();
    const alternatives = evaluation.feasible
      ? []
      : optimizationEngine.findAlternatives(ctx, { day: targetDay, periodId: targetPeriodId }, 5);
    record(
      'optimization_engine.find_alternatives',
      'compute:local',
      evaluation.feasible ? 'skipped' : 'ok',
      evaluation.feasible
        ? 'Skipped: requested slot is already feasible.'
        : `Found ${alternatives.length} feasible alternative(s), each re-checked by the constraint engine.`,
      started,
    );

    const base = deterministicDecision(evaluation, alternatives);
    let finalDecision: AiDecision = base.decision;
    let advisory: Advisory | null = null;

    started = Date.now();
    if (isMetaAiEnabled()) {
      try {
        const meta = await chatJson<MetaAdvisoryResponse>([
          {
            role: 'system',
            content:
              'You are an advisory assistant for a school timetable admin. You NEVER decide feasibility: ' +
              'hard constraints have already been evaluated programmatically and are final. ' +
              'Explain the outcome, analyse the teacher-stated reason, and recommend what the admin should do. ' +
              'Respond only with a JSON object.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction:
                'Return JSON {recommendation: approve|reject|manual_review, confidence: 0-1, summary: string}. ' +
                'recommendation="approve" may only mean "the admin may proceed"; it cannot make an infeasible slot feasible.',
              facts: {
                teacherRequestReason: request.reason || null,
                current: { day: slot.day, periodId: slot.periodId },
                requested: { day: targetDay, periodId: targetPeriodId },
                constraintFeasible: evaluation.feasible,
                violations: evaluation.violations.map((v) => ({ code: v.code, message: v.message })),
                alternatives: alternatives.map((a) => ({
                  day: a.day,
                  periodId: a.periodId,
                  startTime: a.startTime,
                  score: a.score,
                })),
              },
            }),
          },
        ]);
        if (isDecision(meta.recommendation)) {
          advisory = {
            recommendation: meta.recommendation,
            confidence:
              typeof meta.confidence === 'number' && Number.isFinite(meta.confidence)
                ? clamp(meta.confidence, 0, 1)
                : 0.5,
            summary:
              typeof meta.summary === 'string' && meta.summary.trim().length > 0
                ? meta.summary.trim()
                : '',
          };
        }
        record(
          'meta_ai.advisory',
          'external:meta-ai-anonymized',
          advisory ? 'ok' : 'failed',
          advisory
            ? `Advisory only (no names/ids sent): recommendation=${advisory.recommendation}.`
            : 'Meta AI returned no valid advisory; deterministic decision kept.',
          started,
        );
      } catch {
        record(
          'meta_ai.advisory',
          'external:meta-ai-anonymized',
          'failed',
          'Meta AI advisory unavailable; deterministic decision kept.',
          started,
        );
      }
    } else {
      record(
        'meta_ai.advisory',
        'external:meta-ai-anonymized',
        'skipped',
        'Meta AI not configured; deterministic decision kept.',
        started,
      );
    }

    if (advisory && !evaluation.feasible && advisory.recommendation === 'approve') {
      record(
        'verify_advisory_against_constraints',
        'compute:local',
        'vetoed',
        'Advisory suggested approve for an infeasible slot; vetoed. The constraint engine is final.',
        Date.now(),
      );
    } else if (advisory) {
      record(
        'verify_advisory_against_constraints',
        'compute:local',
        'ok',
        'Advisory checked against constraint result; it cannot override feasibility.',
        Date.now(),
      );
    }

    if (advisory && evaluation.feasible && advisory.recommendation !== 'approve' && finalDecision === 'approve') {
      finalDecision = 'manual_review';
      record(
        'apply_escalation_policy',
        'compute:local',
        'ok',
        `AI advisory escalated a feasible move to manual review (${advisory.recommendation}); auto-approval is blocked, admin decides.`,
        Date.now(),
      );
    }

    request.aiDecision = finalDecision;
    request.aiConfidence = Math.round(clamp(advisory?.confidence ?? 1, 0, 1) * 100) / 100;
    request.aiReason = base.reason;
    request.constraintFeasible = evaluation.feasible;
    request.constraintViolations = evaluation.violations;
    request.suggestedAlternatives = alternatives;
    request.agentRecommendation = advisory?.recommendation ?? null;
    request.agentSummary = advisory?.summary || null;
    request.aiProcessedAt = new Date();

    const autoEligible =
      finalDecision === 'approve' && evaluation.feasible && env.ai.autoApproveSchedule && options.applyIfApproved;

    if (!autoEligible) {
      const why = !env.ai.autoApproveSchedule
        ? 'AI_AUTO_APPROVE_SCHEDULE is off (default); admin approval is required.'
        : !options.applyIfApproved
          ? 'Caller did not request auto-apply.'
          : `Decision is ${finalDecision}, not approve.`;
      record('apply_slot_move', 'write:timetable', 'skipped', why, Date.now());
      request.agentTrace = trace;
      return this.requestRepo.save(request);
    }

    started = Date.now();
    const freshSlot = await this.slotRepo.findOne({ where: { id: slot.id, schoolId } });
    const freshCtx = freshSlot ? await loadSchedulingContext(schoolId, freshSlot) : null;
    const recheck = freshCtx
      ? constraintEngine.evaluate(freshCtx, { day: targetDay, periodId: targetPeriodId })
      : null;
    if (!freshSlot || !recheck?.feasible || !recheck.target) {
      record(
        'verify_before_act',
        'compute:local',
        'vetoed',
        `Re-check before applying failed: ${recheck?.violations.map((v) => v.code).join(', ') || 'slot missing'}. Move aborted.`,
        started,
      );
      request.aiDecision = recheck ? deterministicDecision(recheck, alternatives).decision : 'manual_review';
      request.aiReason = recheck
        ? deterministicDecision(recheck, alternatives).reason
        : 'Slot disappeared before applying; manual review is required.';
      request.constraintFeasible = false;
      request.constraintViolations = recheck?.violations || request.constraintViolations;
      request.agentTrace = trace;
      request.aiProcessedAt = new Date();
      return this.requestRepo.save(request);
    }
    record('verify_before_act', 'compute:local', 'ok', 'Fresh constraint re-check passed immediately before applying.', started);

    started = Date.now();
    freshSlot.day = recheck.target.day;
    freshSlot.periodId = recheck.target.periodId;
    freshSlot.startTime = recheck.target.startTime;
    await this.slotRepo.save(freshSlot);
    record(
      'apply_slot_move',
      'write:timetable',
      'ok',
      `Slot moved to ${recheck.target.day} ${recheck.target.startTime}-${recheck.target.endTime}.`,
      started,
    );

    started = Date.now();
    const verified = await this.slotRepo.findOne({ where: { id: slot.id, schoolId } });
    const verifiedOk =
      verified?.day === recheck.target.day &&
      verified?.periodId === recheck.target.periodId &&
      verified?.startTime === recheck.target.startTime;
    record(
      'verify_after_act',
      'read:timetable',
      verifiedOk ? 'ok' : 'failed',
      verifiedOk ? 'Reloaded slot matches the applied target.' : 'Reloaded slot does NOT match the applied target.',
      started,
    );

    request.status = 'approved';
    request.autoProcessed = true;
    request.agentTrace = trace;
    const saved = await this.requestRepo.save(request);

    if (request.teacherId) {
      started = Date.now();
      try {
        await this.notifyTeacher(
          schoolId,
          request.teacherId,
          'Approved schedule change',
          'Your schedule change request was automatically approved.',
        );
        record('notify_teacher', 'write:notification', 'ok', 'Teacher notified of the approved move.', started);
      } catch {
        record('notify_teacher', 'write:notification', 'failed', 'Notification failed; the applied move is unaffected.', started);
      }
      saved.agentTrace = trace;
      await this.requestRepo.save(saved);
    }

    return saved;
  }

  async suggestAlternatives(
    schoolId: string,
    requestId: string,
  ): Promise<{
    requestId: string;
    feasible: boolean;
    violations: ConstraintEvaluation['violations'];
    target: ConstraintEvaluation['target'];
    alternatives: SuggestedAlternative[];
  }> {
    const request = await this.requestRepo.findOne({ where: { id: requestId, schoolId } });
    if (!request) throw ApiError.notFound('Schedule change request not found');
    const slot = request.slotId
      ? await this.slotRepo.findOne({ where: { id: request.slotId, schoolId } })
      : null;
    if (!slot) throw ApiError.notFound('Timetable slot not found for this request');
    const ctx = await loadSchedulingContext(schoolId, slot);
    const target = {
      day: request.requestedDay || slot.day,
      periodId: request.requestedPeriodId || slot.periodId,
    };
    const evaluation = constraintEngine.evaluate(ctx, target);
    const alternatives = optimizationEngine.findAlternatives(ctx, target, 5);
    return {
      requestId,
      feasible: evaluation.feasible,
      violations: evaluation.violations,
      target: evaluation.target,
      alternatives,
    };
  }

  async evaluatePending(
    schoolId: string,
    limit = 25,
  ): Promise<{ evaluated: number; failed: number; requestIds: string[] }> {
    const pending = await this.requestRepo.find({
      where: { schoolId, status: 'pending', aiProcessedAt: IsNull() },
      order: { createdAt: 'ASC' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    let evaluated = 0;
    let failed = 0;
    const requestIds: string[] = [];
    for (const request of pending) {
      try {
        await this.evaluate(schoolId, request.id, { applyIfApproved: true });
        evaluated += 1;
        requestIds.push(request.id);
      } catch (error) {
        failed += 1;
        logger.error(
          `Schedule change request ${request.id} (school ${schoolId}) could not be analysed automatically`,
          error instanceof Error ? error : undefined,
        );
      }
    }
    return { evaluated, failed, requestIds };
  }

  async listPendingReview(schoolId: string): Promise<ScheduleChangeRequest[]> {
    return this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.teacher', 'teacher')
      .leftJoinAndSelect('request.slot', 'slot')
      .where('request.schoolId = :schoolId', { schoolId })
      .andWhere('request.status = :status', { status: 'pending' })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }
}

export const scheduleAutomationService = new ScheduleAutomationService();
