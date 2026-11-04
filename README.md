# 🏫 MultiSchool Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20%20LTS%20%7C%2022-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Optional-DC382D?logo=redis&logoColor=white)

**A multi-tenant SaaS platform for Quranic schools, private schools, and kindergartens — students, teachers, attendance, payments, timetables, messaging, and AI-powered features.**

[Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Database](#-database) • [Testing](#-testing) • [Production](#-production-deployment) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [Available Scripts](#-available-scripts)
- [First Login](#-first-login)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)
- [Security](#-security)
- [Additional Documentation](#-additional-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

A complete web platform that serves multiple schools from a single system with full data isolation between schools (multi-tenancy). It supports three school types and four user roles:

| School Type | Description |
|---|---|
| `quranic` | Quranic school — tracks Surah/Juz memorization and each student's progress |
| `private` | Private school — courses, modules, lessons, sessions, and student enrolments |
| `kindergarten` | Kindergarten / nursery — activities (physical, creative, cognitive, social, moral, linguistic) and participations |

| Role | Summary of Permissions |
|---|---|
| `super_admin` | Manages all schools, subscriptions & quotas, platform statistics, executive AI assistant |
| `school_admin` | Manages teachers, students, classrooms, courses, attendance, payments, timetable, and school settings |
| `teacher` | Syllabus/program, attendance, student progress, activities, timetable (view + change requests) |
| `parent` | Follows their child: progress, attendance, timetable, messages, and notifications |

The UI supports three languages — **Arabic (RTL) / English / Français** — plus light and dark themes.

---

## ✨ Key Features

- **True multi-tenancy:** School isolation enforced centrally in authentication and in the data layer (a School A token never works on School B).
- **Complete management:** Schools, teachers, parents, students, classrooms, courses, sessions, daily/per-session attendance, payments, receipts, and reports.
- **Interactive timetable:** Drag & drop grid, study-day/period settings, and teacher change requests backed by a deterministic Constraint Engine and Optimization Engine.
- **Messaging & notifications:** Real-time conversations (Socket.IO), notifications with retention policies and priority classification.
- **AI features (optional — Meta AI):** Early academic-risk prediction, smart parent summaries, schedule-change automation (AI is advisory only and can never approve a move), absence-document reading (SAM 3.1 segmentation + Vision extraction) with mandatory human review before any absence is justified, and a Business Intelligence assistant for the Super Admin. Without an API key the platform still works fully using deterministic heuristic fallbacks.
- **Advanced security:** HttpOnly cookie sessions + CSRF double-submit, instant session revocation (token versioning), AES-256-GCM field & document encryption, strong password policy, rate limiting, and Helmet.
- **Production-safe database:** `synchronize` in development only; reviewed migrations only in production.

> Full AI details: [`AI_FEATURES.md`](./AI_FEATURES.md) — Security details: [`SECURITY_NOTES.md`](./SECURITY_NOTES.md)

---

## 🛠 Tech Stack

### Frontend — `frontend/`

| Technology | Usage |
|---|---|
| React 19 + TypeScript 5.7 | User interface |
| Vite 6 | Build tool & dev server |
| MUI 7 (Material UI) + Tailwind CSS 4 | UI components & styling |
| React Router 7 | Routing |
| Axios | HTTP requests to `/api` |
| i18next + react-i18next | i18n: EN / FR / AR with RTL |
| Recharts + Framer Motion | Charts & animations |
| Playwright | E2E tests |

### Backend — `backend/`

| Technology | Usage |
|---|---|
| Node.js + Express 4 + TypeScript 5.5 | API server |
| TypeORM 0.3 + MySQL 8 (`mysql2`) | Database |
| Redis (`ioredis`) — optional | Cache — the server runs without it |
| Socket.IO | Real-time messaging |
| JWT (HS256) + HttpOnly cookies | Authentication & sessions |
| Helmet, CORS, express-rate-limit, hpp, xss-clean | Hardening |
| Winston | Logging |
| node-cron | Scheduled jobs (daily notification cleanup) |
| Swagger (`swagger-jsdoc` / `swagger-ui-express`) | API documentation |
| Multer | File uploads (encrypted documents) |

---

## 📁 Project Structure

```
multySchoolPlatform1/
├── README.md                        # This file
├── .env.example                     # Reference env template (copy to backend/.env)
├── AI_FEATURES.md                   # Full AI features documentation
├── AUDIT.md                         # Project audit report
├── SECURITY_NOTES.md                # Security notes & decisions
├── multySchoolsPlatform1_db.sql     # Ready-to-import SQL dump (alternative to seed/migrations)
│
├── backend/                         # API server — Express + TypeORM (port 5000)
│   ├── .env.example                 # Backend env template → copy to .env
│   ├── .env                         # Your real secrets (NEVER commit to Git)
│   ├── package.json
│   ├── MIGRATIONS.md                # Production migrations guide
│   ├── src/
│   │   ├── server.ts                # Entry point
│   │   ├── app.ts                   # Express setup & middleware
│   │   ├── config/                  # env.ts, data-source.ts, redis.ts
│   │   ├── modules/                 # ai, school, student, teacher, course,
│   │   │                            # attendance, payment, timetable, message, ...
│   │   ├── database/seeds/          # seed.ts (Super Admin + 114 Surahs)
│   │   ├── migrations/              # Reviewed migrations
│   │   ├── routes/                  # Route aggregation
│   │   ├── shared/                  # auth, tenant, middleware, utils, i18n
│   │   └── cron/                    # Scheduled jobs
│   ├── tests/                       # Backend integration/E2E tests
│   ├── uploads/                     # Encrypted AI documents (never commit)
│   └── logs/
│
└── frontend/                        # Web app — React + Vite (port 5173)
    ├── .env.example                 # Frontend env template (no secrets, ever)
    ├── package.json
    ├── vite.config.ts               # Proxy: /api → http://localhost:5000
    ├── playwright.config.ts         # E2E configuration
    ├── src/
    │   ├── views/                   # landing, superAdmin, schoolAdmin, teacher, parent, shared
    │   ├── components/              # common, dashboard, landing, messages, notifications
    │   ├── services/                # 19 API services (auth, school, student, ...)
    │   ├── contexts/                # Auth, School, Theme, Notification
    │   ├── guards/                  # AuthGuard, GuestGuard, RoleGuard, SchoolGuard
    │   ├── layouts/  routes/  theme/  types/  hooks/  utils/  i18n/
    │   └── main.tsx
    └── e2e/                         # Playwright tests
```

---

## 📋 Prerequisites

Install the following before you start:

| Tool | Required Version | Check | Notes |
|---|---|---|---|
| [Node.js](https://nodejs.org/) | **20 LTS or 22** | `node -v` | npm is bundled with it |
| npm | 10+ (bundled with Node) | `npm -v` | Package manager |
| [MySQL](https://dev.mysql.com/downloads/mysql/) | **8.0+** | `mysql --version` | Or a compatible MariaDB / XAMPP / Docker |
| Redis | Any recent version | `redis-cli ping` | **Optional** — the server runs without it (no cache) |
| Git | Any version | `git --version` | To clone the project |

> **Operating systems:** The commands below work on Linux, macOS, and Windows. Where a command differs, both variants are shown (on Windows use PowerShell, Git Bash, or WSL).

---

## 🚀 Quick Start

A full run needs **two terminal windows**: one for the Backend and one for the Frontend, after a one-time database setup.

### Step 0 — Clone the project

```bash
git clone <repository-url>
cd multySchoolPlatform1
```

### Step 1 — Create the database

Open MySQL and run:

```sql
CREATE DATABASE multySchoolsPlatform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> The default database name in the examples is `multySchoolsPlatform`. You may rename it, as long as it matches `DB_DATABASE` in `backend/.env`.

<details>
<summary><b>Fast alternative:</b> import the ready-made dump <code>multySchoolsPlatform1_db.sql</code></summary>

```bash
# Linux / macOS
mysql -u root -p multySchoolsPlatform < multySchoolsPlatform1_db.sql

# Windows (PowerShell)
cmd /c "mysql -u root -p multySchoolsPlatform < multySchoolsPlatform1_db.sql"
```

When importing the dump you do not need `npm run seed` or manual table creation. For a completely clean start (empty database), skip the import and follow the steps below instead.

</details>

### Step 2 — Set up the Backend and install its `node_modules`

```bash
cd backend

# 1) Create the environment file from the template
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 2) Edit .env with your database credentials and strong secrets
#    (see the Environment Variables section below)

# 3) Install dependencies (node_modules)
npm install
# Or, for an exact lockfile install (recommended for CI/production):
# npm ci
```

Then seed the initial data (Super Admin + 114 Surahs) — **first run only**:

```bash
npm run seed
```

If you did not set `SUPER_ADMIN_INITIAL_PASSWORD` in `.env`, the seed prints the Super Admin password exactly once — **copy it immediately** (see [First Login](#-first-login)).

### Step 3 — Run the Backend server (Terminal 1)

```bash
cd backend
npm run dev
```

| Item | Value |
|---|---|
| Server URL | http://localhost:5000 |
| Health check | http://localhost:5000/health → `{"status":"ok"}` |
| API base | http://localhost:5000/api |
| Auto-restart | On code changes (`ts-node-dev --respawn`) |

> In development (`NODE_ENV=development`) TypeORM creates the tables automatically (`synchronize`). On success you will see `Database connected successfully` and `Server running on port 5000`. A missing Redis only logs a warning — the server keeps running without cache.

### Step 4 — Install the Frontend packages and run the website (Terminal 2)

Keep the Backend terminal running and open a new terminal:

```bash
cd frontend

# The frontend needs no secret keys — the env file is optional in development
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# Install dependencies (node_modules)
npm install
# Or: npm ci

# Start the dev server
npm run dev
```

| Item | Value |
|---|---|
| Website URL | http://localhost:5173 |
| API connection | Automatic via Vite proxy in `vite.config.ts`: `/api` → `http://localhost:5000` |

Open http://localhost:5173 in your browser and the platform is live.

### ✅ Daily Run Summary (after the first setup)

```bash
# Terminal 1 — Server
cd backend && npm run dev

# Terminal 2 — Website
cd frontend && npm run dev
```

Then open: **Website** http://localhost:5173 • **Server** http://localhost:5000/health

---

## 🔐 Environment Variables

### Where the files live

| File | Purpose |
|---|---|
| `backend/.env.example` | Complete backend template — copy it to `backend/.env` |
| `frontend/.env.example` | Frontend template — optional in development, never contains secrets |
| `.env.example` (project root) | Unified reference copy with copy instructions |
| `backend/.env` | Your real file — **never commit it to Git** (already in `.gitignore`) |

```bash
cp backend/.env.example backend/.env            # Linux / macOS
Copy-Item backend\.env.example backend\.env     # Windows PowerShell
```

### Backend variables — `backend/.env`

#### Core (always required)

| Variable | Example | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` for dev / `production` for production |
| `PORT` | `5000` | API server port |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend origin allowed by CORS (comma-separated for multiple). **Must match the actual website origin** |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | `••••••` | Database password |
| `DB_DATABASE` | `multySchoolsPlatform` | Database name |
| `JWT_SECRET` | Secret ≥ 32 chars | Access-token signing key — **required in production** |
| `JWT_EXPIRES_IN` | `7d` | Access-token lifetime |
| `JWT_REFRESH_SECRET` | A different secret ≥ 32 chars | Refresh-token signing key — **required in production** |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh-token lifetime |

#### Encryption, sessions & security

| Variable | Default | Description |
|---|---|---|
| `ENCRYPTION_KEY` | — | AES-256-GCM field-encryption key. **Mandatory in production** (the server refuses to boot without it). Generate: `openssl rand -hex 32` |
| `ENCRYPTION_KEY_ID` | `k1` | Current key id when rotating keys |
| `ENCRYPTION_KEYS` | — | JSON map for rotation: `{"k1":"<hex>","k2":"<hex>"}` |
| `AUTH_COOKIE_SAMESITE` | `lax` | Auth-cookie policy: `lax` same-site, `none` (requires HTTPS) cross-site, `strict` strictest |
| `AUTH_SESSION_CACHE_MS` | `30000` | Session-state (revocation) cache TTL in milliseconds |
| `TRUST_PROXY` | `false` | Enable (`true`) only behind exactly one trusted reverse proxy |
| `HSTS_PRELOAD` | `false` | Enable only after every subdomain serves HTTPS (hard to undo) |

#### Redis, rate limits & scheduled jobs

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | `localhost` / `6379` / empty | Optional Redis connection (cache) |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | General rate-limit window |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `NOTIFICATION_CLEANUP_CRON` | `0 2 * * *` | Notification cleanup schedule (cron) |
| `NOTIFICATION_CLEANUP_TZ` | `Africa/Algiers` | Scheduler timezone |

#### Seed (first run only)

| Variable | Default | Description |
|---|---|---|
| `SUPER_ADMIN_INITIAL_PASSWORD` | Generated & printed once | First Super Admin password (≥ 12 chars). Recommended to set explicitly |
| `SUPER_ADMIN_PHONE` | `0555000000` | First Super Admin phone / login id |

#### AI (entirely optional — the platform works without it)

| Variable | Default | Description |
|---|---|---|
| `META_AI_API_KEY` | — | Meta Model API key (supported alias: `LLAMA_API_KEY`). **Backend only — never put it in the frontend** |
| `META_AI_BASE_URL` | `https://api.meta.ai/v1` | Meta Model API base URL |
| `META_AI_MODEL` | — | Text model id available to your key |
| `META_AI_VISION_MODEL` | Value of `META_AI_MODEL` | Vision model for document extraction (may equal the text model if multimodal) |
| `AI_REQUEST_TIMEOUT_MS` | `30000` | AI request timeout |
| `AI_AUTO_APPROVE_SCHEDULE` | `false` | `true` = auto-approve conflict-free schedule changes (after a fresh constraint re-check) |
| `SAM_API_URL` / `SAM_API_KEY` / `SAM_MODEL` | Same Meta API / same key / `sam-3.1` | SAM 3.1 segmentation service (segmentation only) |
| `DOCUMENT_ENCRYPTION_KEY` | — | Encryption key for uploaded AI documents (`openssl rand -hex 32`). **Set it before the first upload — changing it later makes old files undecryptable** |

> ⚠️ **Golden rules:**
> 1. Never commit a real `.env` file to Git, and never share it in chats or screenshots.
> 2. Never put any secret in a `VITE_*` variable — everything in the frontend is exposed to the browser.
> 3. Generate strong secrets: `openssl rand -hex 32` (Linux/macOS/WSL) or in Node: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
> 4. **Restart the server** after any `.env` change.

### Frontend variables — `frontend/.env`

The frontend **needs no mandatory variable in development**: `/api` requests go through the Vite proxy to `http://localhost:5000` (defined in `frontend/vite.config.ts`). Only optional variables exist:

| Variable | Usage |
|---|---|
| `PORT` | Port for `frontend/server.mjs` when serving the production build manually (default `5173`) |
| `E2E_BASE_URL` | Override the Playwright test base URL (by default it serves `npm run preview` on `4173`) |

---

## 🗄 Database

| Mode | How tables are created |
|---|---|
| **Development** (`NODE_ENV=development`) | Automatically via TypeORM `synchronize` when running `npm run dev` |
| **Production** (`NODE_ENV=production`) | Reviewed migrations only — the server **refuses to boot** if migrations are pending |

```bash
cd backend

npm run seed                 # Initial data: Super Admin + 114 Surahs (once only)

# Migrations (generate in development ONLY — never generate on a production server)
npm run migration:generate -- src/migrations/<timestamp>-<Name>   # Generate after an entity change
npm run migration:run        # Apply (in production: NODE_ENV=production npm run migration:run)
npm run migration:revert     # Revert the last migration
```

> 📖 Full guide & strict production rules: [`backend/MIGRATIONS.md`](./backend/MIGRATIONS.md) — always back up the production database before any migration.

Clean reinstall of `node_modules` when needed:

```bash
# Backend
cd backend && rm -rf node_modules package-lock.json && npm install
# Windows PowerShell: Remove-Item -Recurse -Force node_modules, package-lock.json; npm install

# Frontend
cd frontend && rm -rf node_modules package-lock.json && npm install
```

---

## 📜 Available Scripts

### Backend — run from inside `backend/`

| Command | Description |
|---|---|
| `npm run dev` | Development server with auto-restart (port `5000`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the production build from `dist/server.js` (after `build`) |
| `npm run typecheck` | Type-check without emitting (app + tests projects) |
| `npm run seed` | Seed initial data (Super Admin + Surahs) |
| `npm run migration:generate -- ...` | Generate a migration (development only) |
| `npm run migration:run` / `migration:revert` | Apply / revert migrations |
| `npm run test:all` | Full quality gate: typecheck + all unit suites + integration |
| `npm run test:scheduling` | Timetable engine tests (constraints + optimization) |
| `npm run test:documents` | Document validation & encryption tests |
| `npm run test:lifecycle` | Document lifecycle, duplicate/overlap prevention tests |
| `npm run test:bi` | Super Admin Business Intelligence tests |
| `npm run test:tenant` | Multi-tenancy isolation tests |
| `npm run test:intelligence` | Finance / notification / curriculum intelligence tests |
| `npm run test:security` | Password policy, lockout & key-rotation tests |
| `npm run test:integration` | Full HTTP integration suite (53 checks, isolated `multyschool_test` DB) |

### Frontend — run from inside `frontend/`

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server at http://localhost:5173 |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run typecheck` | Type-check only (`tsc -b`) |
| `npm run preview` | Preview the production build locally (port `4173`) |
| `npm run lint` | Lint with Oxlint |
| `npm run test:e2e` | Build + Playwright tests (Chromium) |
| `npm run deploy` | Build & deploy to GitHub Pages |

---

## 🔑 First Login

1. Run `npm run seed` from `backend/` (after configuring `.env`).
2. Sign in as Super Admin:
   - **Phone:** the value of `SUPER_ADMIN_PHONE` (default `0555000000`)
   - **Password:** the value of `SUPER_ADMIN_INITIAL_PASSWORD` if you set it; otherwise copy the one-time password printed by the seed
   - **URL:** http://localhost:5173/superAdmin/login
3. The account is flagged `mustChangePassword` — the platform forces a password change on first login before any other action.
4. From the Super Admin dashboard, create the first school (its School Admin account is created with it), then start at http://localhost:5173 via the school page and its login.

> There is intentionally no shared/default password baked into the code — this is by design for security.

---

## 🧪 Testing

```bash
# Backend — everything at once (typecheck + unit + integration)
cd backend && npm run test:all

# Backend — type & build gate
cd backend && npm run typecheck && npm run build

# Frontend — types, lint & build
cd frontend && npm run typecheck && npm run lint && npm run build

# Frontend — E2E tests (Playwright/Chromium: build + 3 smoke flows)
cd frontend && npm run test:e2e
```

> The `test:integration` suite runs against an isolated `multyschool_test` database, so it never touches development data.

---

## 🌐 Production Deployment

```bash
# ---------- Backend ----------
cd backend
cp .env.example .env          # Then set NODE_ENV=production, strong secrets & production values
npm ci
NODE_ENV=production npm run migration:run   # Apply reviewed migrations ONLY (after a backup)
npm run build
npm start                     # Or via a process manager such as PM2 / systemd

# ---------- Frontend ----------
cd frontend
npm ci
npm run build                 # Output in frontend/dist
npm run preview               # Local preview — or serve dist via Nginx/Apache/CDN
# npm run deploy              # Ready alternative: deploy to GitHub Pages
```

Production checklist:

- [ ] `NODE_ENV=production` with strong, distinct `JWT_SECRET` / `JWT_REFRESH_SECRET` / `ENCRYPTION_KEY` set.
- [ ] `FRONTEND_URL` matches the real frontend domain, and both the website and API are behind **HTTPS**.
- [ ] `DOCUMENT_ENCRYPTION_KEY` set before the first document upload.
- [ ] Database backed up, then `migration:run` — never `migration:generate` or seed on production.
- [ ] `TRUST_PROXY=true` only behind one trusted proxy; `AUTH_COOKIE_SAMESITE=none` only for a cross-site API over HTTPS.
- [ ] Backend restarted after any `.env` change.

> Detailed guides: [`backend/MIGRATIONS.md`](./backend/MIGRATIONS.md) and [`SECURITY_NOTES.md`](./SECURITY_NOTES.md)

---

## ❓ Troubleshooting

| Problem / Error | Likely Cause | Solution |
|---|---|---|
| `npm: command not found` / `node: command not found` | Node.js not installed | Install Node 20 LTS or 22 from nodejs.org, reopen the terminal, verify `node -v` |
| `npm install` fails or packages are missing at runtime | Corrupted/incomplete `node_modules` | Delete `node_modules` and the lockfile, then `npm install` again (see Database section) |
| `EADDRINUSE: address already in use :::5000` (or `5173`) | Port already in use | Stop the other process, or change `PORT` in `backend/.env` / pass another frontend port: `npm run dev -- --port 5174` |
| `Database connection failed` / `ECONNREFUSED 127.0.0.1:3306` | MySQL stopped or wrong credentials | Start MySQL, confirm the database exists, and match `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE` to your server |
| `Access denied for user ...` | MySQL user permissions | Grant the user rights on the database or use correct credentials in `.env` |
| `Redis connection failed, running without cache` | Redis not running | **Warning only** — ignore it for development, or start Redis and restart the server |
| Website opens but login/requests fail (CORS / 401) | Backend stopped or `FRONTEND_URL` mismatch | Make sure `npm run dev` is running in `backend` and `FRONTEND_URL=http://localhost:5173`, then restart the server |
| `JWT_SECRET and JWT_REFRESH_SECRET must be set in production` | Missing production secrets | Set them in `backend/.env` (the server refuses to boot by design) |
| `Pending database migrations detected` on production boot | Migrations not applied | Back up, then run `NODE_ENV=production npm run migration:run` — never generate them on production |
| Forgot the seeded Super Admin password | It is printed only once | Set `SUPER_ADMIN_INITIAL_PASSWORD` before the first `seed`; after creation, change it in the UI or reset it as an admin |
| `.env` edits have no effect | Server not restarted | Stop `npm run dev` and start it again (env is read at boot) |
| Old AI documents fail to upload/decrypt | `DOCUMENT_ENCRYPTION_KEY` changed | Restore the original key — files encrypted with one key cannot be opened with another |
| Browser shows an old version of the website | Build cache | Rebuild with `npm run build` and hard-refresh (Ctrl+Shift+R) |

---

## 🔒 Security

- HttpOnly cookie sessions + CSRF (double-submit) protection; tokens are never stored in `localStorage`.
- AES-256-GCM encryption for sensitive fields and AI documents, with key-rotation support (`ENCRYPTION_KEYS`).
- Passwords: minimum 12 characters, common-password blocklist, `bcrypt` cost 12, and temporary account lockout after 5 failed attempts.
- Layered rate limiting + Helmet + allow-list CORS (`FRONTEND_URL`).
- Multi-tenant school isolation enforced centrally in authentication and in the data layer.

> Full details, design decisions, and remaining work: [`SECURITY_NOTES.md`](./SECURITY_NOTES.md) — never place the Meta AI key in the frontend (`VITE_*`).

---

## 📚 Additional Documentation

| Document | Contents |
|---|---|
| [`AI_FEATURES.md`](./AI_FEATURES.md) | AI features: prediction, schedule automation, SAM/Vision documents, Business Intelligence |
| [`SECURITY_NOTES.md`](./SECURITY_NOTES.md) | Encryption, sessions, isolation, and remaining security work |
| [`AUDIT.md`](./AUDIT.md) | Project audit report |
| [`backend/MIGRATIONS.md`](./backend/MIGRATIONS.md) | Migration workflow & production rules |
| [`frontend/API_DOCUMENTATION.md`](./frontend/API_DOCUMENTATION.md) | API documentation from the frontend perspective |
| [`frontend/AGENTS.md`](./frontend/AGENTS.md) | Comprehensive frontend docs: roles, routes, services, themes |

---

## 🤝 Contributing

1. Branch from the main branch: `git checkout -b feature/<name>`.
2. Follow existing code patterns (strict TypeScript, one API service per entity in the frontend, `tenantScope` for new backend data queries).
3. Before any Pull Request, run the quality gates:

```bash
cd backend && npm run typecheck && npm run test:all
cd frontend && npm run typecheck && npm run lint && npm run build
```

4. Never commit secrets, `.env` files, or `node_modules` / `dist` / `uploads` folders.

---

## 📄 License

Private project — all rights reserved by the project owners. Do not redistribute or publish without written permission.

---

<div align="center">

**MultiSchool Platform** — One platform… many schools 🚀

<sub>Frontend: React 19 + Vite 6 • Backend: Express 4 + TypeORM • Database: MySQL 8 • Cache: Redis (optional)</sub>

</div>


