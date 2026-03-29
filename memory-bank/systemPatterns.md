# System Patterns

Architecture and conventions for the Dictogloss codebase.

## High-Level Structure

- **App Router** under `app/`: public marketing/home as needed, `(auth)/login`, `(admin)/admin/*`, `lesson/[shareToken]/*` for students.
- **API routes** under `app/api/`: `admin/*` (authenticated + `ADMIN` role), `lesson/*` (public, rate-limited, no sentence text leakage), `auth/*` (NextAuth).
- **Libraries** under `lib/`: `db` (Prisma), `auth`, `validations` (Zod), `audio`, `ai`, `storage` (S3-compatible Spaces).

## Data & Security

- **Soft delete:** `deletedAt` on `User` and `Lesson`; no hard deletes for these entities in app logic.
- **Student identifier in URLs:** use `shareToken` only, not internal `Lesson.id`.
- **Answers:** compare `studentText.trim() === sentence.text.trim()` on the server.
- **Audio:** store objects in Spaces; serve via **presigned URLs**; enforce `playCount <= 3` on the server when issuing URLs or incrementing plays.

## API Response Shape

Use a consistent envelope (see `dictogloss-api-contracts`):

```json
{ "data": { }, "error": null }
```

Errors return `data: null` and a structured `error` object without stack traces.

## Prisma Client

- Single shared instance via `lib/db/prisma.ts` using the global guard pattern to avoid exhausting connections in development.

## Validation

- All mutable API inputs validated with **Zod** before auth/business logic.

_Update as patterns stabilize._
