---
name: prisma-database
description: >-
  Guides PostgreSQL and Prisma work for this project—schema design, migrations,
  Prisma Client usage, and seed scripts. Forbids raw SQL in application code;
  requires migrations for schema changes. Always confirms Prisma syntax and
  patterns via Context7 MCP first. Use when the task involves database schema,
  migrations, Prisma queries, seeding, or data modeling.
---

# Prisma & database (Dictogloss)

## Before writing code

- Call **Context7 MCP** for current Prisma schema, migrate, and client API docs.
- Read `/memory-bank/systemPatterns.md` after substantive schema changes.

## Rules (non-negotiable)

- **No raw SQL** in app code—use **Prisma Client** only.
- Schema changes go through **`prisma migrate`** (dev) / **`migrate deploy`** (prod)—never hand-edit production DB.
- Use **soft deletes** (`deletedAt`) for user and lesson data as per project rules—no hard deletes for those entities in normal flows.

## Workflow

1. Update `schema.prisma`.
2. Run a named migration; review generated SQL in the migration folder before applying to shared/prod environments.
3. Run `prisma generate` after schema changes.
4. Keep **`prisma/seed.ts`** in sync for local/dev bootstrap data.

## Queries

- Prefer small, explicit `select`/`include` shapes; avoid loading entire tables in hot paths.
- Validate external input with **Zod** before it touches Prisma—never pass unvalidated strings into queries.
