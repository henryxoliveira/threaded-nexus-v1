# Threaded Nexus — Roadmap

## v1 (current)

- [x] Monorepo scaffold (pnpm, TypeScript, Fastify, Next.js, BullMQ, Prisma).
- [x] Data model: SourceEvent, Person, Company, Identity, Interaction, Task, AuditLog, ToolApproval.
- [x] Ingest API + worker normalization (GMAIL stub → Person, Interaction).
- [x] Tool Gateway: request → approve → execute; stub handlers; audit.
- [x] Web: dashboard counts, approvals page.
- [x] Docker Compose (Postgres, Redis); env config; CI (lint, typecheck, test).

## v1.1

- [ ] Google OAuth: token storage (encrypted), Gmail connector implementation (read threads/messages), GCal connector (read/create events).
- [ ] OpenAI-compatible LLM provider in `packages/llm`; use for summarize, action items, drafts (behind feature flag or env).
- [ ] Real tool handlers: send_email (Gmail API), create_calendar_event (Calendar API); approval flow already in place.

## v1.2+

- [ ] Sequences: multi-step outreach model + jobs.
- [ ] LinkedIn: treat carefully; manual-assisted or read-only integration; no scraping in repo.
- [ ] Discord/Telegram/iMessage: “Clawdbot/OpenClaw-style” agent shell (docs/architecture only until spec’d).
- [ ] Auth: session + Google OAuth for API and web.
- [ ] Temporal (or extended BullMQ) for durable workflows.
