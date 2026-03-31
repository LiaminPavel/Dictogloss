# Active Context

Current focus, decisions, and notes for the agent.

## Current Phase

**Phase 4 — Statistics** in progress (lesson stats API and admin stats page implemented locally).

## Decisions Log (Phase 0)

1. **`create-next-app` in repo root:** Running `npx create-next-app@latest .` failed because (a) the folder name `Dictogloss` violates npm package name rules (no uppercase), and (b) the directory was not empty. **Resolution:** Scaffolded into a temporary directory named `dictogloss`, then synced files into the project root with `rsync` so the app lives in the current repository without a permanent subfolder.
2. **Next.js version:** `create-next-app@latest` targeted Next 16 + React 19 + Tailwind v4. **Resolution:** Aligned with project rules (`dictogloss-project.mdc`): **Next.js 14.2.35**, **React 18.3**, **Tailwind CSS 3.4**, classic `@tailwind` directives, `.eslintrc.json` + `eslint-config-next@14`, `next lint` script.
3. **Prisma:** Using **Prisma 6.19** with `provider = "prisma-client-js"` (default client location). `prisma.config.ts` loads **`DATABASE_URL` from `.env.local`** via `dotenv` for CLI and migrations.
4. **Dependencies (Context7-checked patterns):** `next-auth@beta` for Auth.js v5; `prisma` + `@prisma/client`; `zod` v4; `openai` and `@anthropic-ai/sdk` current majors from npm; AWS SDK v3 packages for DO Spaces; `bcryptjs` for password hashing (min 12 rounds in app code).
5. **Seed admin:** Email **`admin@dictogloss.app`**, password **`Admin123!`**, name **Admin**, role **ADMIN** (per task specification; change password in production).
6. **`.env` vs `.env.local`:** Only **`.env.local`** is maintained for developers; Prisma CLI reads it through `prisma.config.ts`. Root `.env` was removed to avoid duplication.

## Language audit (Phase 0)

- All new code, Prisma schema, memory-bank, `.cursorrules`, and translated `.cursor/rules/dictogloss-database-schema.mdc` are **English**.
- `.cursor/agents/pre-commit-check.md` and `language-auditor.md` metadata no longer embed Cyrillic trigger phrases (triggers described in English).
- **`PROJECT_PLAN.md`** still contains extensive Russian copy from the original stakeholder brief; English product/technical specs live in **memory-bank** and **prisma/schema.prisma**. Full translation of `PROJECT_PLAN.md` was not required to unblock Phase 0 build.

## Tooling

- **`.cursor/agents/git-cleanup.md`:** Subagent for pre-commit/push hygiene (temp files, OS junk, console cleanup except logger, imports, suspicious literals). Complements `pre-commit-check`.

## Decisions Log (Phase 1)

1. **Auth.js v5 wiring:** Added root `auth.ts` and route handler `app/api/auth/[...nextauth]/route.ts` to follow v5 centralized export pattern (`handlers`, `auth`, `signIn`, `signOut`).
2. **Credentials strategy:** Implemented credentials auth with Prisma user lookup + bcrypt comparison, JWT session strategy, and role/id propagation via `jwt` and `session` callbacks.
3. **Route protection:** Added `middleware.ts` matcher for `/admin/:path*` and `/api/admin/:path*`; page routes redirect to `/login`, API routes return `401` with project error envelope.
4. **Login UX:** Added `/login` page and client form with Zod validation before `signIn("credentials")`, plus callback redirect handling back to protected route.
5. **Production host trust:** Fixed Auth.js runtime `UntrustedHost` on DigitalOcean by enabling `trustHost: true` in `lib/auth/config.ts` (Context7 confirms parity with `AUTH_TRUST_HOST=true`).

## Decisions Log (Phase 2)

1. **New lesson UI scope:** Implemented `app/(admin)/admin/lessons/new` as a UI-first form with local Zod validation, voice cards, and sentence preview before wiring APIs.
2. **Voice selection model:** Kept OpenAI-supported voices (`alloy`, `nova`, `onyx`, `echo`, `fable`, `shimmer`) grouped by accent for clear teacher UX.
3. **Preview behavior:** Sentence parsing is line-based, trims whitespace, and updates in real time without `useEffect` (computed via `useMemo` from textarea state).
4. **Lesson creation API:** Added `POST /api/admin/lessons` with payload validation, admin auth, and atomic creation of `Lesson` + ordered `Sentence` rows.
5. **Audio generation strategy:** Added `POST /api/admin/lessons/[id]/generate` to process one pending sentence per call, generate TTS via OpenAI, upload MP3 to DO Spaces, and persist `audioStatus`.
6. **Progress UX:** Lesson form now runs create + repeated generate calls and updates progress counters sentence-by-sentence until done, then shows a shareable lesson URL.
7. **Dashboard data:** Admin dashboard now lists teacher lessons with sentence/attempt counts, audio-ready progress, failure count, and share links.
8. **Lesson detail API/UI:** Added `GET /api/admin/lessons/[id]` and `/admin/lessons/[id]` page with sentence-level audio statuses and copyable share link.
9. **Failed audio recovery:** Added sentence-specific regeneration endpoint `POST /api/admin/lessons/[id]/sentences/[sentenceId]/regenerate` for `FAILED` items.
10. **Soft delete:** Added `DELETE /api/admin/lessons/[id]` that sets `deletedAt` and `isActive=false` instead of hard deletion.

## Decisions Log (Phase 3)

1. **Public lesson metadata:** `GET /api/lesson/[shareToken]` returns title/voice/accent/sentence count and ordered sentence IDs only (no sentence texts).
2. **Attempt lifecycle:** Added `POST /api/lesson/[shareToken]/attempt` and `PATCH /api/lesson/[shareToken]/attempt/[id]/complete` for start/finish bookkeeping.
3. **Audio playback control:** Added `GET /api/lesson/[shareToken]/audio/[sentenceId]?attemptId=...` issuing presigned URLs and enforcing max 3 plays server-side via `StudentAnswer.playCount`.
4. **Answer validation:** Added `POST /api/lesson/[shareToken]/answer` with exact check `studentText.trim() === sentence.text.trim()` and `correctText` returned only when wrong.
5. **Student UI flow:** Implemented `/lesson/[shareToken]` (name entry), `/practice` (progress bar, play limit UI, Enter submit, wrong/correct states), and `/results` (final score + retry link).

## Decisions Log (Phase 4)

1. **Stats API contract:** Added `GET /api/admin/lessons/[id]/stats` returning lesson meta, attempts table data, and per-sentence accuracy aggregates.
2. **Aggregation approach:** Used Prisma reads + in-memory reduction for per-sentence correctness stats to keep implementation explicit and maintainable.
3. **Admin UI coverage:** Added `/admin/lessons/[id]/stats` page with attempt table and sentence accuracy table; linked it from dashboard and lesson detail.
4. **Dashboard KPIs:** Added summary cards for total lessons, total attempts, and average audio readiness.

## Open Items

- Run `npx prisma migrate dev` when a local PostgreSQL instance is available.
- Run `npx prisma db seed` after the first migration.
- `npm audit` reports high-severity issues in transitive dependencies; review before production lockfile freeze.

_Update every session._
