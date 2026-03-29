---
name: digitalocean-deploy
description: >-
  Guides deployment and infrastructure for this project on Digital Ocean App Platform,
  managed PostgreSQL, and Spaces (S3-compatible) for audio storage—env vars, build/run
  commands, connection strings, CORS, and running Prisma migrations in production.
  Use when the task involves deploy, hosting, Docker, DO Spaces, production database,
  CDN URLs, or environment configuration for cloud.
---

# Digital Ocean deploy & storage (Dictogloss)

## Stack reminders

- **App Platform**: build `npm run build`, run `npm start` (or as defined in repo).
- **PostgreSQL**: managed cluster connection string → `DATABASE_URL`.
- **Spaces**: S3-compatible API via AWS SDK; audio objects **not** public—use **presigned URLs** for playback.

## Environment

- Mirror variables from `.env.production.example` (or project template) into DO App **Environment**; no secrets in the image or repo.
- Set `NEXTAUTH_URL` and `NEXTAUTH_SECRET` for the production domain; secret must be strong (≥32 chars).

## Database on prod

- After deploy: run **`prisma migrate deploy`** from the app environment or a one-off job/console—never skip migrations.
- Run **`db seed`** only when appropriate for that environment (usually staging/dev—not blindly on prod).

## Spaces / audio

- Bucket **private**; restrict listing where possible.
- Configure **CORS** for GET from your frontend origin only.
- Store **`audioUrl`** or keys in Prisma; serve playback through signed URLs, not direct public buckets.

## Docker (if used)

- Multi-stage builds; do not copy `.env.local` into layers; use runtime env from DO.

## After infra changes

- Document new env vars or endpoints in `/memory-bank/techContext.md`.
