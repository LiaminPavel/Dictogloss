# Active Context

Current focus, decisions, and notes for the agent.

## Current Phase

**Phase 0 — Setup** completed. Next: **Phase 1 — Auth** (NextAuth v5, credentials, protected `/admin` and `/api/admin/*`).

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

## Open Items

- Run `npx prisma migrate dev` when a local PostgreSQL instance is available.
- Run `npx prisma db seed` after the first migration.
- `npm audit` reports high-severity issues in transitive dependencies; review before production lockfile freeze.

_Update every session._
