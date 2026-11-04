# Security Notes

## Security hardening

### Encryption formats
- New writes use AES-256-GCM authenticated encryption in `backend/src/shared/utils/encryption.ts`, formatted as `gcm:v2:<keyId>:<base64(iv12+tag16+ciphertext)>` (12-byte random IV, 16-byte auth tag). `gcm:v1:` payloads (no key id) remain readable with the single key of their time. Tampered GCM payloads fail authentication on decrypt.
- **Legacy AES-CBC support and its hardcoded key have been removed.** `decrypt()` now throws on CBC-shaped values instead of silently using a key that shipped in source control. Migrate first, once, with the inventory/re-encryption tool (dry-run by default; the historical key material is supplied by the operator via `LEGACY_CBC_SECRET`/`LEGACY_CBC_SALT` env only for that run and is then deleted with the script):
  ```bash
  cd backend
  LEGACY_CBC_SECRET='...' LEGACY_CBC_SALT='...' npm run security:re-encrypt-legacy            # inventory (writes nothing)
  LEGACY_CBC_SECRET='...' LEGACY_CBC_SALT='...' npm run security:re-encrypt-legacy -- --apply # decrypt -> GCM -> verify per row
  ```
  Production order: run the inventory against production before deploying the CBC-less build; only deploy after `--apply` reports `legacy-cbc=0` (verified end-to-end on a seeded test row). Values matching neither GCM format are still returned unchanged (legacy plaintext tolerance).
- Key rotation: set `ENCRYPTION_KEYS={"k1":"<current>","k2":"<new>"}` and `ENCRYPTION_KEY_ID=k2` — new writes use `k2`, old `k1`/`v1` ciphertexts stay readable with no downtime; drop `k1` once re-encryption of old rows is done. Keys live in env/secret management, never in the database.
- `safeEqual(a, b)` provides a constant-time comparison (SHA-256 digests compared with `crypto.timingSafeEqual`). It is used **only** for the CSRF double-submit comparison; JWT validity is always established by `jsonwebtoken` signature/expiry verification in `verifyAccessToken`/`verifyRefreshToken`, never by `safeEqual`.

### Key management
- Set `ENCRYPTION_KEY` in production (backend refuses to start without it). Generate one with `openssl rand -hex 32`. A 64-char hex value is used directly as the 32-byte key; any other non-empty string is SHA-256-hashed to a key. When unset (development only), the key falls back to `sha256(JWT_SECRET + ':field-encryption')`, so rotating `JWT_SECRET` or setting `ENCRYPTION_KEY` after data was written with the fallback makes that data undecryptable — set a stable `ENCRYPTION_KEY` before writing encrypted data, and rotate only with a re-encryption plan.
- `ENCRYPTION_KEY` is distinct from the AI document key (`DOCUMENT_ENCRYPTION_KEY`, under `env.ai`).

### JWT, cookies and sessions
- HS256 is pinned (`algorithms: ['HS256']`) on sign and verify, with issuer `multyschool-platform` and audience `multyschool-web`.
- **Tokens are no longer returned in JSON nor stored in web storage.** Login/refresh set `access_token` (HttpOnly, `Path=/api`) and `refresh_token` (HttpOnly, `Path=/api/auth`) cookies plus a JS-readable `csrf_token` cookie; the frontend keeps tokens only in memory-free cookie form, sends `X-CSRF-Token` on mutating requests (double-submit, compared with `safeEqual`), and purges legacy `*accessToken`/`*refreshToken` localStorage keys on load. Cookie flags: `Secure` in production, `SameSite` configurable (`AUTH_COOKIE_SAMESITE`, default `lax`; use `none`+HTTPS only for cross-site APIs). CSRF, refresh rotation and logout are covered by the integration suite (53 checks).
- **Immediate revocation:** every user row carries `tokenVersion`; tokens embed `tv`. `authenticate` compares the claim against the (30s in-process-cached) account state on each request — nonexistent or inactive accounts and version mismatches are rejected at once. Password change, super-admin password reset, user update/deactivation/deletion, and `POST /auth/logout-all` bump the version (invalidating all devices); plain `POST /auth/logout` clears the cookies. Remaining limit: a stolen access token stays valid until the next version bump or its own expiry if the account is untouched, and the session cache delays revocation by up to 30s.
- Seeding no longer creates a shared default super-admin password: `SUPER_ADMIN_INITIAL_PASSWORD` (env) or a one-time random password printed once, with `mustChangePassword` blocking every endpoint except profile/logout until it is changed; the web app force-redirects to the profile page.
- Password policy: minimum 12 characters (long passphrases allowed, no composition rules), a built-in common-password blocklist, bcrypt cost 12. Login throttling: the per-IP `authLimiter` plus a per-account in-memory lockout (5 failures → 15 minutes; clears on success, and on process restart — use Redis before scaling horizontally).

### HTTP / platform
- Helmet: CSP `default-src 'none'` (this service is a JSON API only — the web app is served separately, so the strict CSP cannot break it; do not reuse this policy on an origin that serves HTML), `frame-ancestors 'none'`, `base-uri 'none'`, `form-action 'none'`, `frameguard: deny`, `nosniff`, XSS filter, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-origin`, HSTS (1 year, includeSubDomains; **preload only when `HSTS_PRELOAD=true`**, i.e. after confirming every subdomain serves HTTPS, since preload submission is hard to undo) in production only. `x-powered-by` disabled; JSON body limit lowered to 1 MB (uploads go through multer), urlencoded to 100 KB. `trust proxy` is fixed at exactly 1 hop and only enabled with `TRUST_PROXY=true` — set it only when the app really sits behind one trusted reverse proxy, otherwise rate limiting can be spoofed via `X-Forwarded-For`.
- CORS stays an env allow-list (`FRONTEND_URL`, comma-separated), now with `maxAge: 600` and exposed `RateLimit-Limit`/`RateLimit-Remaining` headers.
- Rate limits: general limiter (env), `authLimiter` (10/15 min), `writeLimiter` (300 non-GET/15 min, applied globally in `app.ts`), `uploadLimiter` (30/15 min, on document scan), `aiLimiter` (60/15 min, on AI prediction/summary/evaluate/scan and super-admin AI chat). Limit responses are localized via `tooManyRequests` (en/fr/ar).

### Passwords
- `hashPassword` enforces the policy in `passwordPolicy.ts` (≥12 chars, ≤128, common-password blocklist, no composition rules) via `assertPasswordStrength`; `comparePassword` is unchanged, so existing users log in as before (the policy gates only new/changed passwords). New/reset passwords that fail the policy return HTTP 400. There is no default seeded password anymore (see JWT/cookies section).

### AI document uploads/downloads
- Upload: client-declared MIME is not trusted — magic-byte sniffing (JPEG/PNG/WebP/PDF) must match the declaration, 10MB cap (multer + service), PDFs containing `/JavaScript`/`/Launch`/embedded files rejected, filenames sanitized, encrypted files written `0600` AES-256-GCM. Frontend must be served over HTTPS (HSTS in production); SAM calls are refused in production unless `SAM_API_URL` is HTTPS.
- Decryption is a privileged, audited operation: only `school_admin` and the owning parent (server-side child-ownership check) may list/view/download; teachers only see the resulting justified flag in attendance. Each upload/view/download/confirm/approve/reject is recorded in `ai_document_access_logs` (actor, role, action, time). Downloads use `attachment`, `nosniff`, `Cache-Control: no-store, private` and a sandboxed CSP, and API payloads never include the filesystem `encryptedPath`.
- AI extraction never justifies an absence: scans start `pending_review`, a human confirms/corrects fields, and only a school-admin approval (single transaction) updates Attendance/CourseAttendance records.

### Multi-tenant isolation
- School claim is enforced centrally in `authenticate` (token `schoolId`/`slug` vs the `resolveSchoolId`-resolved school on every `/:schoolId/*` route) in addition to per-route `authorize()`; data-layer helpers in `src/shared/tenant/tenantScope.ts` (`scopedWhere`, `TenantScopedRepository`, `assertEntityInSchool` → 404 for cross-tenant ids, `assertParentOwnsStudent`) are the contract for new queries instead of relying on each developer remembering a `schoolId` condition. Cross-tenant scenarios are covered by `npm run test:tenant`.
- Revocation is handled by per-user `tokenVersion` checked at authentication (30s cache) — see the JWT/cookies section; role/school edits and deactivation bump it through the school-admin user services.
- Notification retention is policy-based (`notificationIntelligence.RETENTION_POLICY`), never delete-on-read: critical items are never auto-deleted and absence/payment notifications are retained 365 days for audit/disputes.

### What remains
- The `Authorization: Bearer` header is still accepted for non-browser API clients/tests; browser sessions use cookies exclusively. Remove the header path once all clients are cookie-based, and shorten access-token lifetime when doing so.
- Session/device registry: revocation is version-based (all devices at once). A per-device session list ("active sessions" UI, selective sign-out) needs a server-side session table/Redis set keyed by a token `sid` claim — planned on top of the existing version mechanism, along with moving the login lockout and session cache to Redis for multi-instance deployments.
- Run the one-time CBC inventory/re-encryption against the production database (see Encryption formats) and then delete `src/scripts/reEncryptLegacyMessages.ts`; CBC rows in an unmigrated database will now fail to decrypt loudly rather than silently using the old key.
- Argon2id for new password hashes (requires a rehash-on-login path for existing bcrypt hashes) — bcrypt cost 12 is retained until then.
