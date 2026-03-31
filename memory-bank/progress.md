# Progress

## Status

**Phase 0 — Setup:** complete.  
**Phase 1 — Auth:** complete in production.  
**Phase 2 — Admin Panel:** complete.  
**Phase 3 — Student Interface:** complete (core flow).  
**Phase 4 — Statistics:** complete.  
**Phase 5 — Deploy:** in progress.

## Completed (Phase 0)

- [x] Next.js project initialized (App Router, TypeScript, ESLint, Tailwind) and aligned to Next 14 / React 18 / Tailwind 3
- [x] Dependencies installed: Prisma, NextAuth beta, bcryptjs, Zod, OpenAI, Anthropic, AWS S3 + presigner, lucide-react, clsx, tailwind-merge, tsx (seed)
- [x] Memory bank populated (`projectbrief`, `activeContext`, `systemPatterns`, `techContext`, `progress`)
- [x] `.cursorrules` created from project Cursor rules
- [x] `.env.local` template with all required variables (placeholders)
- [x] `.gitignore` verified for `node_modules`, `.next`, `.env*` (covers `.env.local`)
- [x] Prisma initialized; full schema with `User`, `Lesson`, `Sentence`, `LessonAttempt`, `StudentAnswer`, enums `Role`, `AudioStatus`; `npx prisma generate` succeeds
- [x] Folder structure with `.gitkeep` under `app/api/*`, route groups, `components/*`, `lib/*`
- [x] `lib/db/prisma.ts` Prisma singleton for Next.js
- [x] `prisma/seed.ts` admin user seed
- [x] `npm run build` passes (verified in Phase 0.11)
- [x] Cursor subagent `git-cleanup` added (`.cursor/agents/git-cleanup.md`)

## Next

- Verify production env values against `.env.production.example`.
- Run final deployment smoke test after next production release.
- Rotate admin password using `SEED_ADMIN_PASSWORD` based seeding flow.
- Validate admin top navigation UX in production after deployment.

## Known Issues

- None blocking local development after Phase 0; database migrations not applied until Postgres is configured.

_Update as work proceeds._
