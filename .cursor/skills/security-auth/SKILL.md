---
name: security-auth
description: >-
  Guides authentication, authorization, and API hardening for this project—NextAuth.js v5,
  credentials flow, bcrypt, sessions, env secrets, rate limiting, and input
  sanitization. Treats every API route as untrusted input until validated and
  authenticated server-side. Use when the task involves auth, login, sessions,
  passwords, roles, API security, environment variables, or threat-sensitive flows.
---

# Security & auth (Dictogloss)

## Before implementing

- Call **Context7 MCP** for NextAuth v5 / Auth.js and bcrypt usage aligned with this repo.
- Never embed secrets in source; use `.env.local` (dev) and platform env (production).

## Secrets & config

- Confirm `.env.local` and secret files stay **out of git** (see project security checklist).
- Production: **Digital Ocean** env vars only—no pasted keys in chat or commits.

## AuthZ model

- **Admin** routes and `/api/admin/*`: require **server-side** session and `role === 'ADMIN'` on every request.
- **Student/lesson** flows: do not trust client-supplied lesson IDs or tokens without verifying `shareToken` / ownership rules in code.

## API design

- **Zod** validate all inputs on every route before business logic.
- **Rate-limit** public-facing endpoints (especially `/api/lesson/*`) per project plan.
- Return generic errors to clients; log details server-side only.

## Passwords & crypto

- **bcrypt**, minimum **12 rounds**, for password hashes.
- Do not return password hashes or internal errors in API responses.

## Review gate

- Before shipping: mentally walk each new endpoint as Security Engineer—session, role, validation, leakage, and abuse cases.
