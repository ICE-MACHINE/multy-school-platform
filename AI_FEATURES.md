# AI Features — Meta AI Agents, Prediction, Schedule Automation, SAM Document Vision

## What was built

| Agent | Backend | Frontend |
|---|---|---|
| **Early academic-risk prediction + smart parent summaries** | `backend/src/modules/ai/prediction.service.ts` — features from `Attendance` + `CourseAttendance` (absences, unjustified) + `StudentLessonProgress` (missed/completed lessons) → heuristic score (always works) refined by Meta AI when a key is set; persists `ai_predictions` | Admin: `/s/:schoolId/admin/ai-insights` (risk cards, batch run, per-student regenerate, summary dialog). Parent: “AI summary” card on the child progress page |
| **Schedule-change automation (3 layers)** | See section below. Slot is moved automatically **only** if `AI_AUTO_APPROVE_SCHEDULE=true` (default `false`) | Admin insights page → “Schedule automation” pending-review queue with per-request Evaluate, engine verdict, violations, ranked alternatives and non-binding AI advisory |
| **Multimodal document workflow (SAM 3.1 segmentation + Meta Vision extraction + human review)** | See section below. Extraction **never** justifies an absence by itself | Parent: upload + confirm from the child attendance page. Admin: `/s/:schoolId/admin/ai-documents` (review, confirm/correct, approve→justify or reject, audited decrypted download) |

### Platform foundations & operations intelligence (what feature work missed)

**A. Multi-tenant isolation — enforced centrally, not per-query memory.** `authenticate` now re-checks the token's school claim against `resolveSchoolId`'s resolved school on *every* `/:schoolId/*` request, so a school-A token is rejected (403) on school B even if a route forgot `authorize()` (which keeps the same check). `backend/src/shared/tenant/tenantScope.ts` is the data-layer contract for new code: `scopedWhere()` (schoolId cannot be overridden by caller where-clauses), `TenantScopedRepository.getByIdOrThrow()` (cross-tenant ids answer 404, never leaking existence), `assertEntityInSchool()`, and `assertParentOwnsStudent()` (the parent-changes-the-student-id scenario). Notification mark-read/delete now also scope by `schoolId` + recipient. Tests replay the review scenarios: `npm run test:tenant` (A-token on B-route rejected at the middleware with a real signed JWT, B-student hidden from A, parent touching another parent's child rejected). *Known remaining gap:* JWTs are stateless — a role/school change does not revoke already-issued tokens until expiry (≤7d); server-side token versioning/revocation is the follow-up, documented in SECURITY_NOTES.

**B. AI Financial Intelligence** — `GET /:schoolId/ai/finance` (school_admin). Pure engine (`financialIntelligence.ts`, tested) strictly separates **`actuals`** (recorded collections by month, expected monthly due = `monthlyFee × active non-exempt students`, collection rate, arrears total/students, repeat late payers = paid-after-due-month ≥2 or ≥2 unpaid months) from **`forecasts`** (3-month linear-trend projection, every point labelled `isForecast` with low/high band and confidence). Debt-growth alerts fire on arrears share. **Expenses:** the platform has no expense ledger, so `expenses.available=false` is returned instead of inventing income-vs-expenses.

**C. Notification Intelligence** — pure engine (`notificationIntelligence.ts`): priority classification, same-day grouping/dedupe (creation dedupes identical group keys within an hour), weekly digest (`GET /:schoolId/ai/notifications/digest`, shown on the notifications page with duplicates-collapsed and urgent groups), best-send-time policy (urgent immediately, else 08:00–19:00 window), and admin interventions (`GET /:schoolId/ai/notifications/intelligence`: ≥3 unjustified absences/14d per student, unread-absence backlog). The old cleanup — which deleted **all read notifications immediately** — is replaced by an explicit retention policy (`RETENTION_POLICY`): critical never auto-deleted, absence/payment (audit) kept 365d read, low-value read 30d, standard read 90d, unread 90/180d.

**D. AI Curriculum Intelligence** — `GET /:schoolId/ai/curriculum?yearEnd=YYYY-MM-DD` (school_admin; teachers see only their own courses). Planned (lessons defined per course) vs executed (distinct lessons in completed `CourseSession`s), session progress, 28-day teaching velocity, days since last session, projected completion date, untaught-lesson lists, and year-end miss risk when `yearEnd` is supplied; per-teacher aggregates expose lagging courses/teachers. Courses with no program/session data (e.g. quranic classrooms) simply return no rows rather than fabricated progress. Engines for B/C/D are unit-tested with recorded-style fixtures: `npm run test:intelligence`.

### Schedule & swap: three layers, AI is advisory only

1. **Constraint Engine** (`backend/src/modules/timetable/scheduling/constraintEngine.ts`, pure, no LLM/DB) — the *only* authority on feasibility. It checks, by **time-interval overlap** (not just equal `periodId`): study day, period existence, operating hours, duration fits the period (breaks preserved), teacher / classroom / course-group / **student** overlap, and classroom & course capacity. The same engine guards the manual paths (`TimetableService.moveSlot`, admin approval in `handleRequest`), so hard constraints cannot be bypassed by drag-and-drop or manual approval either.
2. **Optimization Engine** (`optimizationEngine.ts`) — exhaustive search over `studyDays × periods`; every candidate is re-validated by the Constraint Engine, then ranked by explainable soft score (same day, closest time, teacher daily load, back-to-back avoidance). Returns top-5 `suggestedAlternatives`. Deliberately no OR-Tools dependency: for single-slot rescheduling the search space is tiny and exhaustive search is exact; a CP-SAT solver can be dropped behind the same `findAlternatives` interface if whole-timetable re-optimization is ever needed.
3. **Meta AI Agent** (`scheduleAutomation.service.ts`) — an audited tool loop, not a single LLM call: `load_scheduling_context → constraint_engine.evaluate → optimization_engine.find_alternatives → meta_ai.advisory (anonymized facts only: violation codes, day/period, teacher-stated reason — no names/ids) → verify_advisory_against_constraints → [verify_before_act → apply_slot_move → verify_after_act → notify_teacher]`. Every step is persisted in `agentTrace` (`tool`, `permission`, `status: ok|skipped|failed|vetoed`, summary, duration). The LLM **cannot approve**: an infeasible slot stays infeasible even if the model says `approve` (traced as `vetoed`); it may only *escalate* a feasible move to `manual_review` (blocking auto-approval) and explain/summarize for the admin (`agentRecommendation`/`agentSummary`, stored separately from the deterministic `aiDecision`/`aiReason`). Deterministic decision: feasible → `approve`; infeasible + alternatives → `manual_review`; infeasible + none → `reject`. Auto-apply additionally requires `AI_AUTO_APPROVE_SCHEDULE=true` **and** a fresh constraint re-check immediately before the write, verified again after it. `GET /:schoolId/ai/schedule-requests/:requestId/alternatives` exposes the deterministic engine + optimizer without any LLM call. Tests: `cd backend && npm run test:scheduling`.

### Documents: a trusted workflow, not just smart OCR

**Roles of the two models (kept strictly separate):** SAM 3.1 — *self-hosted or third-party hosted, it is not a Meta API key* — does **segmentation only** (bbox/polygon/mask-area; only those geometric fields are allow-listed from its response, `role: "segmentation_only"`). The **Vision LLM** does the semantic work (document type, student name, dates, reason, issuer, OCR text, confidence). Neither justifies an absence.

**Workflow:** `upload → magic-byte validation → AES-256-GCM at rest (0600) → SAM segmentation → Vision extraction → deterministic verification → human review → admin decision → absence update`

1. **Upload hardening** (`documentFileValidation.ts`): declared MIME is never trusted — content is sniffed (JPEG/PNG/WebP/PDF magic bytes) and must match, empty/oversized (>10MB) files rejected, PDFs with `/JavaScript`, `/Launch` or embedded files rejected, filenames sanitized, multer `fileFilter`+limits as a first gate (Multer errors now return 400/413, not 500). SAM is skipped in production unless `SAM_API_URL` is HTTPS.
2. **Deterministic verification** (`verification` column): extracted name vs the linked student's actual name, date validity/range, low-confidence (<0.7) flag, extraction-skipped flag (PDFs / no vision key → human enters fields manually). Always `requiresHumanReview: true`; the scan lands in `reviewStatus: pending_review`.
3. **Human review:** parent (own child only, enforced server-side; parents must supply `studentId`) or admin confirms/corrects the extracted fields — `POST /documents/:id/confirm` → `confirmed`. Only a **school_admin** gives the final decision — `POST /documents/:id/review {decision, note?, startDate?, endDate?}`. Final decisions are immutable through this API (409 on re-review).
4. **Absence update (approval only):** in a single DB transaction, all matching unexcused `Attendance` **and** `CourseAttendance` records for that student in the approved date range are marked `justified` with the extracted reason; the applied record ids are stored on the scan (`appliedAttendanceIds/appliedCourseAttendanceIds`). No matching absence → 400 and nothing is justified. Rejection changes no attendance. The parent is notified either way.
5. **Who may decrypt:** list/view/download are restricted to `school_admin` and the owning parent (teachers see only the resulting `justified` flag in attendance — never raw medical documents). Every `upload/view/download_decrypted/confirm/approve/reject` is written to `ai_document_access_logs`. Downloads are `attachment` + `nosniff` + `Cache-Control: no-store` + sandboxed CSP, and API responses no longer expose the server-side `encryptedPath`. Transport is HTTPS at the platform edge (HSTS in production). Tests: `cd backend && npm run test:documents` (magic bytes, MIME spoofing, script-PDF rejection, AES-GCM tamper rejection, verification flags).
6. **Document Lifecycle Management:** states `pending_review → confirmed → {approved | rejected} → archived`, plus `expired`, enforced by a pure state machine (`documentLifecycle.ts`) — final/archived/expired states reject further review actions (409), approved documents never "expire". Every transition and every field correction is written to `ai_document_revisions` (actor, role, from→to, per-field diff, note) and is readable via `GET /documents/:id/history` (admin sees actor ids; parents see roles only); the admin dialog renders this timeline. Expiry is automatic: an actionable document whose coverage ended more than 30 days ago (or that is 90 days old without dates) becomes `expired` lazily on any access and via `POST /documents/expire-stale`. Archiving is a deliberate admin action (`POST /documents/:id/archive`) from approved/rejected/expired.
7. **Duplicate & overlap prevention:** (a) *Same file:* the SHA-256 of the original bytes (`contentHash`, never exposed by the API) is checked before writing anything — an identical re-upload returns the existing document and logs `duplicate_upload_blocked`; the same bytes submitted for a *different* student are rejected 409 without leaking the other document. (b) *Same period:* approvals store their coverage (`approvedStartDate/approvedEndDate`, so multi-day certificates become explicit ranges); inside the approval transaction, any overlap with another approved/archived document for that student is rejected 409 (the admin may narrow the range and retry), and records already justified — by an earlier document or manually — are filtered out and never rewritten (all-already-justified → 409). Tests: `npm run test:lifecycle` (transition matrix, multi-day expiry math, edge-day/contained overlaps, hash collisions).

All endpoints live under `/api/:schoolId/ai/*` with the existing auth/role/school-isolation middleware (a parent can only access their own children's predictions/documents). UI is fully translated EN/FR/AR (`ai.*` keys, 1,404 keys/locale).

**Privacy by design:** prediction prompts sent to Meta contain anonymized numeric features only — never student names. Document images are sent to the Meta vision model (and to your SAM endpoint, if configured) only when you upload a scan.

**Graceful degradation:** with no API key the platform still works — predictions use the deterministic heuristic (`source: "heuristic"` chip), documents are stored encrypted with `segmentation.provider: "unavailable"`.

## ✅ What YOU need to do (the only required part)

Open **`backend/.env`** — all keys are already there, empty — and fill in:

```env
META_AI_API_KEY=<your Meta / Llama API key>     # REQUIRED
META_AI_MODEL=<model id available to your key>  # REQUIRED, e.g. a Llama text model id from your Meta AI account
META_AI_VISION_MODEL=<multimodal model id>      # REQUIRED for document extraction; may equal META_AI_MODEL if that model accepts images
```

Then restart the backend (`npm run dev`). Nothing goes in the frontend — never put the key in a `VITE_*` variable.

### Optional (each unlocks one extra behaviour)

```env
# 1) SAM 3.1 segmentation — SAM is NOT a hosted Meta API with a public key.
#    Deploy SAM 3.1 yourself (self-host / Hugging Face / Replicate) exposing:
#    POST {SAM_API_URL}/segment  body {image: base64, mimeType} -> {bbox, polygon, maskAreaRatio, confidence}
SAM_API_URL=
SAM_API_KEY=

# 2) Recommended before uploading real documents (generate: openssl rand -hex 32).
#    Set it BEFORE first upload — changing it later makes old files undecryptable.
DOCUMENT_ENCRYPTION_KEY=

# 3) Fully automatic approval of conflict-free teacher schedule changes.
#    Default false = AI evaluates + recommends, an admin clicks Evaluate/approve.
AI_AUTO_APPROVE_SCHEDULE=false
```

### Database

Dev (`synchronize` on) creates `ai_predictions`, `ai_document_scans` (now incl. `reviewStatus/verification/confirmed*/reviewed*/applied*/contentHash/approved*Date/archived*/expiredAt` columns), `ai_document_access_logs`, `ai_document_revisions` and the new `schedule_change_requests` columns (`ai*` + `constraintFeasible/constraintViolations/suggestedAlternatives/agentRecommendation/agentSummary/agentTrace`) automatically. **Production:** never generate migrations there — deploy the reviewed, committed migrations and run `NODE_ENV=production npm run migration:run` (the baseline migration was generated/reviewed in development and verified on an empty scratch database; the production server now refuses to boot with pending migrations). Full runbook: `backend/MIGRATIONS.md`.

## Verification performed
TypeScript is at **zero errors on both sides, gated**: backend `npm run typecheck` (`tsc --noEmit` incl. the tests project) and full `npm run build`; frontend `npm run typecheck` (`tsc -b`, the same compiler step as `npm run build`, which also completes the Vite production build) — the old "19 backend / 28 frontend pre-existing errors" figures no longer exist and are not carried forward. Backend `dev` no longer uses `--transpile-only`. Tests: six unit suites (`test:scheduling`, `test:documents`, `test:lifecycle`, `test:bi`, `test:tenant`, `test:intelligence`), one HTTP integration/E2E suite (`npm run test:integration`: real cookie-based login with no tokens in JSON, CSRF enforcement, token revocation after password change, cross-tenant 403/404, parent IDOR, schedule evaluation, document approval→justified absence, duplicate/overlap rejection, intelligence endpoints, super-admin trends — 53 checks against an isolated `multyschool_test` database; plus `test:security` for password policy, login lockout, GCM key versioning and CBC removal), and frontend browser E2E (`npm run test:e2e`: Playwright/Chromium, 3 smoke flows incl. Arabic RTL switch). `npm run test:all` runs the whole backend gate.

## Super Admin AI Assistant (added later)

The **Super Admin** (المسؤول العام) gets his own assistant at `/superAdmin/ai-assistant`, built on his actual work — running the whole SaaS: school onboarding, freezing, subscription fees (`monthlyFee`), user/message quotas (`maxUsers`/`maxMessages`), and platform growth.

- **Backend:** `GET /api/super-admin/ai/briefing` (executive summary + highlights + prioritized recommendations), `GET /api/super-admin/ai/insights` (deterministic alerts: schools ≥80–90% of user quota → propose plan upgrade, message quota, churn risk = old schools with 0 students/teachers, frozen/inactive follow-up, no payments this month, growth), `POST /api/super-admin/ai/chat` (conversational Q&A over a live 60s-cached platform snapshot: MRR, payments this month, new schools, per-school usage). Meta AI answers from the snapshot when `META_AI_API_KEY` is set; otherwise localized EN/FR/AR rule-based answers — **no new env keys needed**.
- **Privacy:** the snapshot sent to Meta contains school-level business aggregates only — no student/parent personal data.

### Business Intelligence Agent (trend analysis, added later)

The assistant is no longer snapshot-only. `GET /api/super-admin/ai/trends` (super_admin only, 60s-cached) returns a deterministic BI pack that is also injected into the briefing and into both the Meta and rule-based chat contexts:

- **Period comparison & trends** (`platformTrends.ts`): 6 monthly points (collections, payment count, refunds, new schools + cumulative, new students/teachers), current-vs-previous-month deltas (abs + %), last-3-months vs previous-3, and per-school current/previous collection comparisons.
- **Decline diagnosis** (`businessIntelligence.ts: diagnoseCollections`): schools that dropped to zero collections, top declining schools, payment-count change, refunds increase, signup change, plus frozen/inactive current-state context — this is what lets the assistant answer *"if collections fell 15% vs last month, why?"* with named schools and numbers instead of a narrative guess.
- **Churn-risk scoring** (deterministic, 0–100: inactive +45, frozen +35, no students/teachers after 14d, no collections this month, very low adoption), **quota/plan recommendations** for schools ≥80% (suggested `maxUsers`/`maxMessages` bringing usage to ~60%; there are no named plan tiers in the product, so quotas are the plan), and a ranked **contact-today** action list (churn, ≥90% quota, frozen, missing collections). The chat answers all six example questions ("contact today", "most resource-consuming", "revenue growth last 3 months", "likely to cancel", "best plan >80%", "why did it decline") deterministically even with no Meta key; Meta rephrases from the same numbers.
- **Honest metric semantics (important):** `payments` are tuition **collected by schools from their students**, and `monthlyFee` is the school's per-student fee (set in school settings) — neither is platform subscription revenue, so the legacy `snapshot.mrr` is only the sum of per-student fee rates and the frontend card was relabelled accordingly. There is **no** cancellation or subscription-payment event history in the schema (freeze/inactive are current states, `deleteSchool` is a soft `isActive=false`), so the system never claims recorded churn/late subscription payments: churn is a risk score and explanations cite `limitations` codes verbatim to both Meta (system-prompt guardrails) and rule-based replies. Tests: `cd backend && npm run test:bi`.
