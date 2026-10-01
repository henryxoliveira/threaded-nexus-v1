# Handoff for Future LLM — Threaded Nexus v1

This file contains the **original bootstrap prompt** and **current status** so another LLM (or human) can continue the work.

---

## Original prompt (master bootstrap instructions)

The following was the full Cursor Master Prompt used to scaffold this repo. Follow it to complete any remaining items.

<details>
<summary>Click to expand: full original prompt</summary>

# CURSOR MASTER PROMPT — Threaded Nexus v1 (bootstrap repo from empty)

You are Cursor (an AI coding agent) working in an empty GitHub repository named **threaded-nexus-v1** (https://github.com/henryxoliveira/threaded-nexus-v1). Your job is to **scaffold the full technical foundation** for this project in one pass, and to create a **README "master prompt"** that future LLMs can use to instantly understand the system, constraints, architecture, and how to work inside this repo.

## 0) What you're building (project context)

**Threaded Nexus** is an always-on personal CRM + outreach copilot + workflow automation system.

It ingests events from:
- **Gmail / Google Calendar** (first-class, v1 priority)
- (Later) LinkedIn messaging (treat carefully / manual-assisted)
- (Later) Discord/Telegram/iMessage interface via "Clawdbot/OpenClaw-style agent shell"

It normalizes raw events into a canonical data model:
- People/Companies/Identities
- Interactions (email threads, meetings, notes)
- Tasks / Follow-ups
- Sequences (multi-step outreach)
- SourceEvents (append-only raw events)
- Audit logs + policies

It then uses LLMs to:
- summarize threads
- extract action items
- draft messages
- prepare meeting briefs
- propose next steps

And (only through a **Tool Gateway**) it can:
- create tasks
- draft/send emails (initially approval required)
- create calendar events

**Non-negotiables:**
- Security-first: OAuth tokens and secrets never stored in plaintext in repo
- Tool actions are permissioned + auditable + usually require approval
- A durable workflow / background jobs layer exists from day 1 (even if minimal)
- The system is designed to run 24/7 (workers) but can be developed locally easily

## 1) Architecture decision for v1 (use this)

Implement a pragmatic "best" foundation:

- **Monorepo** using **pnpm workspaces**
- **TypeScript** across all services
- Backend: **Fastify** (simple, fast) + **Zod** for schemas
- DB: **Postgres** with **pgvector**
- Migrations/ORM: **Prisma**
- Queue/Jobs: **BullMQ** + **Redis** (Temporal later)
- Web UI: **Next.js** (minimal UI, admin/dev console)
- Auth: Start with **internal dev auth** + Google OAuth planned; keep clean seams
- Integrations: Gmail/Calendar connectors stubbed with clean interfaces (implementation can come next)
- LLM: a provider-agnostic interface (`LLMClient`) with OpenAI-compatible implementation stub

Project style: "boring, maintainable, secure, testable."

## 2) Your output requirements (what to create)

You must create:
1) A **README.md** that acts as a "master prompt" for future LLMs + humans
2) A **docs/** folder with:
   - `architecture.md` (diagram + components)
   - `data-model.md` (entities + relationships)
   - `security.md` (threat model + token handling + approval)
   - `workflows.md` (job patterns + idempotency)
   - `roadmap.md` (v1 milestones)
3) A working monorepo scaffold:
   - `apps/api` (Fastify API)
   - `apps/web` (Next.js)
   - `apps/worker` (BullMQ worker)
   - `packages/core` (domain models, types, zod schemas)
   - `packages/db` (Prisma schema + migrations)
   - `packages/integrations` (connector interfaces + stubs)
   - `packages/llm` (LLM interface + stub provider)
   - `packages/tool-gateway` (permissioned tools + audit log interface)
   - `packages/config` (env parsing, config loading)
4) Local dev environment:
   - `docker-compose.yml` for Postgres + Redis
   - `.env.example` with safe placeholders
   - `Makefile` or npm scripts to run everything
5) Baseline engineering hygiene:
   - ESLint + Prettier
   - TypeScript configs
   - Jest or Vitest for unit tests (choose one; prefer Vitest)
   - GitHub Actions CI (lint + typecheck + test)
   - Conventional commit hints in README (optional)
6) A minimal vertical slice proving wiring works:
   - `POST /ingest/source-event` (API) writes `SourceEvent` to DB
   - Worker consumes a queue job and normalizes a sample email event into an `Interaction` (stubbed normalization)
   - `GET /health` returns OK
   - `GET /debug/stats` returns counts (SourceEvents, Interactions, Tasks)
   - Web UI shows a tiny dashboard with those counts

Everything should run locally with:
- `pnpm install`
- `docker compose up -d`
- `pnpm dev` (runs api, web, worker concurrently)

## 3) Data model (must implement in Prisma)

[Full Prisma model list as in original — see `packages/db/prisma/schema.prisma` and `docs/data-model.md`.]

## 4) "Tool Gateway" rules (must be coded)

[Request → approve → execute; Zod-validated; stub handlers. See `packages/tool-gateway` and README.]

## 5) Jobs / worker rules

[BullMQ `normalize-source-event` queue; idempotency by rawRef/sourceId. See `docs/workflows.md`.]

## 6) LLM layer (stub but correct)

[`packages/llm` with `summarizeEmailThread`; mock provider; TODO OpenAI. See README.]

## 7) Web UI (minimal)

[Next.js: `/` dashboard counts, `/approvals` list + approve/reject. See `apps/web`.]

## 8) Environment variables

[`packages/config` + Zod; `.env.example`. See README.]

## 9) Scripts

[`pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:migrate`, `pnpm db:studio`.]

## 10) Deliverables checklist (do not skip)

[Full checklist in original — see README and docs.]

## 11) Implementation constraints

[No secrets in repo; clean seams for OAuth; TODOs for LinkedIn/Clawdbot in docs only.]

## 12) Start now

[Scaffold → Prisma → API/Worker/Web slice → docs + README → CI.]

</details>

---

## Where we are at (status)

### Done

- **Monorepo**: pnpm workspace, root `package.json`, `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc`, `.gitignore`.
- **packages/config**: Zod env schema, `loadConfig()`.
- **packages/core**: Zod schemas (SourceKind, IngestSourceEvent, etc.), `NORMALIZE_SOURCE_EVENT_QUEUE`.
- **packages/db**: Full Prisma schema (SourceEvent, Person, Company, Identity, Interaction, InteractionParticipant, Task, AuditLog, ToolApproval), initial migration under `prisma/migrations/`, `createPrismaClient`, exports.
- **packages/llm**: `LLMClient`, `summarizeEmailThread` types, `MockLLMProvider`.
- **packages/integrations**: `Connector` / `RawConnectorEvent`, `GmailConnector`, `GCalConnector` (stubs).
- **packages/tool-gateway**: `ToolGateway` (requestToolAction, approveToolAction, getApprovedActions, markExecuted), Zod tool schemas (send_email, create_calendar_event), stub handlers, `executedAt` on ToolApproval.
- **apps/api**: Fastify app, `GET /health`, `GET /debug/stats`, `POST /ingest/source-event`, `GET /approvals`, `POST /approvals/:id/approve`, `POST /approvals/:id/reject`, `POST /tools/request`, BullMQ enqueue on ingest.
- **apps/worker**: BullMQ worker for `normalize-source-event`, GMAIL normalization (Person, Identity, Interaction, idempotent by rawRef), periodic execution of approved tool actions, error handling (`processingError`).
- **apps/web**: Next.js app, `/` dashboard (counts from API), `/approvals` (list, approve/reject buttons).
- **Docker**: `docker-compose.yml` (Postgres 16, Redis 7).
- **Env**: `.env.example` with DATABASE_URL, REDIS_URL, PORT, NEXT_PUBLIC_API_URL.
- **Docs**: `README.md` (master prompt), `docs/architecture.md`, `docs/data-model.md`, `docs/security.md`, `docs/workflows.md`, `docs/roadmap.md`.
- **CI**: `.github/workflows/ci.yml` (install, db:generate, build, lint, typecheck, test).
- **Tests**: Vitest in config and core; `packages/config` and `packages/core` have passing unit tests.
- **Root scripts**: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm db:generate`.

### Likely remaining / verify

1. **Build order**: CI runs `pnpm build` then `pnpm typecheck`. Last run fixed API/worker/tool-gateway to use `@threaded-nexus/db` for `PrismaClient` and removed unused imports; worker and tool-gateway built successfully; API had minor fixes. **Action**: Run `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint` locally to confirm full green.
2. **pnpm dev**: Runs `pnpm run --parallel dev --filter "./apps/*"`. Ensure API port (3001), Web (3000), and worker all start; no env required beyond `.env` from `.env.example`.
3. **DB**: After `docker compose up -d`, run `pnpm db:migrate` once. Optional: add a `Makefile` with `up`, `migrate`, `dev` if the user wanted that (original said "Makefile or npm scripts" — npm/pnpm scripts are in place).
4. **pgvector**: In schema/roadmap; not yet added to Prisma. Can be added when needed for embeddings.

### Suggested next steps for tomorrow

1. Run full local verification: `pnpm install`, `docker compose up -d`, `pnpm db:migrate`, `pnpm dev`; hit `GET /health`, `GET /debug/stats`, `POST /ingest/source-event` (curl from README), refresh dashboard and approvals.
2. If any CI step fails, fix the failing package (build/typecheck/lint/test).
3. Proceed with roadmap: OAuth stubs → real Gmail/Calendar connectors, OpenAI LLM provider, real tool handlers.

---

## Key file map

| Purpose | Location |
|--------|----------|
| Master prompt for LLMs | `README.md` |
| Architecture / diagram | `docs/architecture.md` |
| Data model | `docs/data-model.md`, `packages/db/prisma/schema.prisma` |
| Security / tokens / approval | `docs/security.md` |
| Jobs / idempotency | `docs/workflows.md` |
| Roadmap | `docs/roadmap.md` |
| Env config | `packages/config`, `.env.example` |
| Ingest + queue | `apps/api/src/routes.ts`, `apps/api/src/queue.ts`, `apps/worker/src/index.ts`, `apps/worker/src/normalize.ts` |
| Tool gateway | `packages/tool-gateway` |
| Web UI | `apps/web/src/app/page.tsx`, `apps/web/src/app/approvals/page.tsx` |
| CI | `.github/workflows/ci.yml` |

Use this handoff plus the original prompt and README to continue from here.
