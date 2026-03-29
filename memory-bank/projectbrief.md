# Project Brief — Dictogloss (English Dictation App)

## What

Web application for English language teachers. Teachers create audio dictation exercises; students complete them via a shared link.

## Users

- **Admin (teacher):** creates lessons, generates audio, shares links, views results.
- **Student:** opens the shared link, listens to audio, types sentences, receives feedback. No account required (name only before start).

## Core Flow

1. Teacher pastes sentences, selects voice and accent; the system generates audio via OpenAI TTS and stores files in Digital Ocean Spaces.
2. Teacher shares a unique lesson link (`shareToken`).
3. Student opens the link, enters their name, listens (max 3 plays per sentence), submits text, gets correctness feedback.
4. Teacher reviews attempts and accuracy in the admin area.

## Key Rules

- Maximum **3** audio plays per sentence (enforced on the server).
- Answer check: **exact** string match after `trim` on both sides; case and punctuation matter.
- On wrong answer: show correct text and a Continue control.
- On correct answer: advance to the next sentence (e.g. short delay then auto-advance).
- Audio is generated once per sentence when the teacher triggers generation, not on each play.
- Never expose `Sentence.text` to the client before the answer is checked (except when returning the correct text after a wrong answer).

## Tech Stack

- Next.js 14 (App Router), TypeScript (strict), Tailwind CSS
- PostgreSQL, Prisma ORM
- NextAuth.js v5 (credentials, JWT session)
- OpenAI API (TTS), Anthropic API (optional AI tasks)
- Digital Ocean App Platform, DO Spaces (S3-compatible) for audio
- Zod for input validation

## Success Criteria (MVP)

- Admin can log in, create a lesson, generate audio, copy the student link.
- Student can complete the full flow and see a summary score.
- Admin can see who attempted the lesson and basic stats.
