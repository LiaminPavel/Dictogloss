# Tech Context

Stack versions and tooling (as of Phase 0 completion). Verify with `package.json` when upgrading.

| Area | Package / tool | Version (approx.) |
|------|----------------|-------------------|
| Framework | `next` | 14.2.35 |
| UI | `react`, `react-dom` | 18.3.x |
| Styling | `tailwindcss` | 3.4.x |
| Lint | `eslint`, `eslint-config-next` | 8.x / 14.2.x |
| ORM | `prisma`, `@prisma/client` | 6.19.x |
| Auth | `next-auth` | 5.x beta (Auth.js) |
| Validation | `zod` | 4.x |
| AI | `openai`, `@anthropic-ai/sdk` | current from lockfile |
| Storage | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | AWS SDK v3 |
| Passwords | `bcryptjs` | 3.x (12+ rounds at hash time) |
| Seed runner | `tsx` | devDependency |
| Config | `dotenv` | devDependency (Prisma CLI + seed) |

## Environment

- **Local:** copy `.env.local` from placeholders; set a real `DATABASE_URL` for Postgres.
- **Prisma:** `prisma.config.ts` loads `.env.local` for `DATABASE_URL`.
- **Node:** use current Node LTS compatible with Next 14 (e.g. 20.x).
- **Auth host trust:** set `AUTH_TRUST_HOST=true` in environments behind proxies (DigitalOcean App Platform) to prevent Auth.js `UntrustedHost`.

## Context7 References Used (Phase 0)

- Next.js 14 docs (`/vercel/next.js` v14.3.0-canary.87) — `create-next-app` flags and Tailwind setup patterns.
- Prisma 6 — `prisma` + `@prisma/client`, `prisma generate`, PostgreSQL datasource.
- NextAuth.js (`/nextauthjs/next-auth`) — `npm install next-auth@beta`, v5 handler export pattern (for Phase 1).

_Update when dependencies or infrastructure change._
