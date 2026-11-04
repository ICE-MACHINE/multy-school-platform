# Code Audit — Worst Practices, Fixes & i18n Rebuild

Scope: `frontend/` (React 19 + TS + MUI, ~117 files with UI text) and `backend/` (Express + TypeORM + MySQL).
Method: static grep/manual review (444 `any` hits, 1,752 Arabic-literal lines before the rebuild, 0 tests found).

## 🔴 Critical (security / data loss)

| # | Finding | Evidence | Fix proposed | Status |
|---|---------|----------|--------------|--------|
| 1 | TypeORM `synchronize: true` in all envs — auto-alters/drops columns in production, data-loss risk | `backend/src/config/data-source.ts:39` | `synchronize: NODE_ENV !== 'production'` + real migrations (`migration:*` scripts already exist but are bypassed) | ✅ Fixed |
| 2 | JWT secrets silently fall back to `'fallbacksecret'`/`'fallbackrefresh'` — tokens forgeable if env missing | `backend/src/config/env.ts:22,24` | Fail fast at boot in production when secrets absent | ✅ Fixed |
| 3 | CORS production origin is placeholder `https://yourdomain.com` — either broken or later "fixed" to `*` with `credentials:true` | `security.middleware.ts:12` | `FRONTEND_URL` env (comma-separated allow-list) | ✅ Fixed (+ `.env.example` added) |
| 4 | JWT access+refresh tokens in `localStorage` — any XSS = full account takeover, per-school prefixes don't mitigate | `frontend/src/utils/tokenKeys.ts:20-34` | Move refresh token to `httpOnly; Secure; SameSite=Lax` cookie, keep short-lived access token in memory only | 📋 Proposed (needs backend cookie endpoint + CSRF token) |
| 5 | `.env` with real secrets present in workspace; backend is a git repo | `backend/.env` | `.env` is gitignored ✅, but rotate any shared secrets; commit only `.env.example` | ✅ `.env.example` added |

## 🟠 High

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| 6b | **Backend does not compile** — ✅ **Fixed (later):** backend and frontend are both at 0 `tsc` errors (`npm run typecheck` in each package, incl. the integration-tests project; full production builds pass). `ts-node-dev --transpile-only` was removed from the backend `dev` script. | Gate CI on `npm run typecheck` in both packages (see `AI_FEATURES.md` → Verification) |
| 6 | **No tests at all** — ✅ **Fixed (later):** 6 unit suites (scheduling/documents/lifecycle/BI/tenant/finance-curriculum-notification engines), a 43-check Supertest HTTP integration/E2E suite on an isolated test DB (auth, tenant isolation, schedule, document approval, intelligence endpoints), and Playwright browser E2E (3 flows) for the frontend. | Keep extending integration coverage toward payments/attendance write paths |
| 7 | Validation middleware exists but is **used by 0 of 19 route files** — DTOs are unenforced type lies | `backend/src/shared/middleware/validation.middleware.ts` vs `grep validate( *.routes.ts → 0` | Wire `validate()` (or migrate to `zod`/`class-validator`) into every mutating route |
| 8 | Backend user-facing errors hardcoded in Arabic (607 lines) regardless of client language | `auth.middleware.ts`, `errorHandler.middleware.ts`, `app.ts` 404 | ✅ Partially fixed: `backend/src/shared/i18n/messages.ts` resolves `Accept-Language` (en/fr/ar) for 404/401/500; remaining domain errors in services should adopt the same helper |
| 9 | Frontend hardcoded `dir: rtl` + `lang="ar"` everywhere (themes, CSS, 14 dialogs) — LTR languages impossible | `carbonTheme.ts:11`, `index.css:16`, `index.html`, `dir="rtl"` ×14 | ✅ Fixed: direction now follows i18n language (see below) |
| 10 | 444 `any`/`as any` — defeats TS in services (`payload: any` on every create/update), `catch (e:any)` in most pages | `frontend/src/services/*`, views | Type DTOs in `src/types/*` (already exist per entity), `catch (e)` + `axios.isAxiosError(e)` helper `getErrorMessage(e, t)` |
| 11 | Giant files / god-services: `stats.service.ts` 754 lines, `TimetablePage.tsx` 953, `payment.service.ts` 470, `message.service.ts` 561 | `wc -l` | Split by subdomain (stats → per-role services, already started for schoolAdmin), extract hooks (`useTimetable*` pattern already used elsewhere) |

## 🟡 Medium

| # | Finding | Fix |
|---|---------|-----|
| 12 | Frontend talks to backend via raw `axios` in `AuthProvider`, duplicating refresh logic already in `services/api.ts` interceptors | Use the shared `api` instance; single refresh path |
| 13 | Deprecated/unmaintained deps: `xss-clean` (broken on modern Express), `multer@1.4.5-lts.1` | Drop `xss-clean` (validate + escape instead), upgrade `multer@2.x` |
| 14 | `decodeToken()` in FE parses JWT without checking `exp` | Check `exp` before trusting the decoded user |
| 15 | No pagination type safety (`pagination: any` in most services), unbounded `find()` in stats | Shared `Paginated<T>` type; require `take/skip` |
| 16 | Redis `retryStrategy: () => null` = never reconnect after first failure; cache silently dead forever | Bounded exponential backoff |
| 17 | Two competing icon/style stacks (MUI + Tailwind + Emotion + framer-motion) and 5 theme files (`carbon*`, `light/darkTheme` legacy) | Delete unused `lightTheme/darkTheme`, document Carbon as the single system |
| 18 | `frontend/AGENTS.md`/`API_DOCUMENTATION.md` describe the product well but no root README explains how to run FE+BE together | Add root README (run order, ports, seed credentials) |

## 🟢 Good practices already present (keep)
Refresh-token deduplication (`api.ts`), `helmet/hpp/compression/rate-limit`, route `lazy()` code-splitting, guards pattern, per-entity `src/types`, winston logger, `asyncHandler`, TypeORM migrations scaffolding, no `dangerouslySetInnerHTML` (0 hits).

---

# i18n Rebuild (EN / FR, Arabic kept)

**Stack:** `i18next` + `react-i18next` + `i18next-browser-languagedetector` (installed).

- `frontend/src/i18n/index.ts` — supported `en | fr | ar`, fallback `en`, detection order localStorage(`app-language`) → navigator → `<html lang>`; on `languageChanged` sets `document.lang`/`dir` (`ar`=RTL, `en/fr`=LTR).
- `frontend/src/i18n/locales/{en,fr,ar}.json` — ~1,400 keys (`common, nav, auth, landing, dashboard, students, teachers, parents, payments, courses, timetable, messages, …`), merged from per-area fragments.
- `LanguageSwitcher` (`components/common/LanguageSwitcher.tsx`) mounted in `LandingNavbar`, both Login pages, and `DashboardTopBar`.
- MUI follows the language: `ThemeProviderWrapper` rebuilds the theme with `direction` + MUI locale (`enUS/frFR/arEG`), so pagination/dialogs/date-pickers flip automatically; hardcoded `direction:'rtl'` in CSS and 14 dialogs removed.
- Sidebar/menu + document titles are key-driven (`menuConfig.labelKey → nav.*`, `DocumentTitleManager → titles.*`); month/payment labels use `Intl.DateTimeFormat` instead of hardcoded Arabic arrays.
- API client sends `Accept-Language` on every request (`services/api.ts`); backend generic errors (404/401/500) answer in that language (`backend/src/shared/i18n/messages.ts`).

**Remaining known gaps:** backend domain error strings inside services (finding #8), API-returned status strings used as colour-map keys in `TeacherDashboard` (backend data, not UI literals), `DAY_LABELS`/`ARABIC_MONTHS` retained only as `Intl` fallbacks.

**Adding a string:** add the key to all three `locales/*.json`, use `t('ns.key')`. **Adding a language:** drop `locales/xx.json`, extend `SUPPORTED_LANGUAGES`, add its MUI locale + switcher label.
