---
name: nextjs-fullstack
description: >-
  Guides Next.js 14 App Router work for this project—API routes, Server Components,
  middleware, auth-aware layouts, and data-fetching patterns (no useEffect for data;
  prefer Server Components, or SWR/React Query on the client when required). Always
  loads current library APIs via Context7 MCP before coding. Use when the task
  involves Next.js, React, App Router, route handlers, middleware, layouts, or
  server/client component boundaries.
---

# Next.js fullstack (Dictogloss)

## Before writing code

- Call **Context7 MCP** for up-to-date docs on Next.js, React, and any related package (NextAuth, Zod, etc.).
- Read `/memory-bank/techContext.md` and `/memory-bank/systemPatterns.md` if they exist.
- Match the file layout in `.cursorrules` (`/app`, `/components`, `/lib`).

## App Router

- Prefer **Server Components** by default; add `"use client"` only when needed (events, browser APIs, client state).
- **Do not** use `useEffect` for primary data loading; fetch on the server or use SWR/React Query per project rules.
- **API routes**: live under `/app/api`; validate inputs with **Zod** before logic; return typed JSON errors without leaking internals.

## Auth & navigation

- Protect `/admin` and `/api/admin` per middleware and session checks already defined in project rules.
- Never trust client-only checks for authorization.

## Quality bar

- TypeScript **strict**; explicit return types on exported functions.
- No hardcoded user-facing strings scattered in code—use constants or config where it fits the codebase.

## After changes

- Update `/memory-bank/activeContext.md` and `/memory-bank/progress.md` when the session rules require it.
