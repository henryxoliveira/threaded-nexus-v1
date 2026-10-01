# Threaded Nexus v1

**Always-on personal CRM + outreach copilot + workflow automation.**

**Author:** Henrique Oliveira  
**Repository:** https://github.com/henryxoliveira/threaded-nexus-v1

This repo is the technical foundation for ingesting events (Gmail, Google Calendar, later LinkedIn and others), normalizing them into a canonical data model (People, Interactions, Tasks, Sequences), and using LLMs to summarize, extract action items, draft messages, and propose next steps. All side-effectful actions (send email, create event) go through a **Tool Gateway** with permissioning and optional human approval.

---

## Master prompt (for LLMs and humans)

Use this section to quickly understand the system, constraints, and how to work in this repo.

### What it is

- **Threaded Nexus** ingests events from Gmail/Google Calendar (v1 priority), and later LinkedIn (manual-assisted) and Discord/Telegram/iMessage (Clawdbot/OpenClaw-style agent shell).
- It normalizes raw events into: **People**, **Companies**, **Identities**, **Interactions** (email threads, meetings, notes), **Tasks**, **Sequences**, **SourceEvents** (append-only), and **AuditLog** + **ToolApproval**.
- LLMs are used to summarize threads, extract action items, draft messages, prepare meeting briefs, and propose next steps.
- **Tool Gateway**: the only path for side effects. Tools (e.g. send email, create calendar event) are requested → optionally approved by a human → then executed by a worker. All requests and decisions are logged.

### Architecture overview

- **Monorepo** (pnpm workspaces): `apps/api` (Fastify), `apps/web` (Next.js), `apps/worker` (BullMQ); `packages/core`, `db`, `config`, `integrations`, `llm`, `tool-gateway`.
- **DB**: Postgres + Prisma; **queue**: BullMQ + Redis.
- **API**: `POST /ingest/source-event`, `GET /health`, `GET /debug/stats`, `GET/POST /approvals`, `POST /tools/request`.
- **Worker**: Consumes `normalize-source-event` queue (normalize SourceEvent → Person, Interaction); periodically executes approved tool actions (stub handlers in v1).
- **Web**: Dashboard (counts), `/approvals` (list, approve, reject).

See **docs/architecture.md** for a diagram and component list.

### How to run

1. **Prerequisites**: Node ≥20, pnpm, Docker (for Postgres + Redis).
2. **Env**: Copy `.env.example` to `.env` and set `DATABASE_URL` (and optionally `REDIS_URL`). Defaults work with `docker compose`.
3. **Services**:  
   `docker compose up -d`  
   `pnpm install`  
   `pnpm db:migrate`  
   `pnpm dev`  
   This runs API (port 3001), Web (port 3000), and Worker concurrently.
4. **Verify**: `GET http://localhost:3001/health` → `{ "ok": true }`. Open http://localhost:3000 for the dashboard.

### How to add a connector

- **Interface**: Implement `Connector` in `packages/integrations` (name, source, optional start/stop).
- **Events**: Produce `RawConnectorEvent` (source, sourceId, payload) and feed into the ingest API: `POST /ingest/source-event`.
- **Normalization**: In `apps/worker`, extend the job handler to handle your `source` (e.g. GCAL): create/update Person, Interaction, etc. Keep idempotency (unique sourceId, rawRef checks).
- **Secrets**: OAuth tokens and API keys must never live in the repo; use env or a secret store. See **docs/security.md**.

### How tools + approvals work

1. **Request**: Call `POST /tools/request` with `{ toolName, payload }`. Payload is validated with Zod (see `packages/tool-gateway` schemas). Creates `ToolApproval` (PENDING) and `AuditLog`.
2. **Approve/Reject**: User (or automation) calls `POST /approvals/:id/approve` or `POST /approvals/:id/reject`. Updates approval status and logs to audit.
3. **Execute**: Worker calls `getApprovedActions()`, runs the registered handler for each (stub in v1), then `markExecuted(approvalId)`.
4. Add new tools: add Zod schema in `tool-gateway/schemas`, register in `toolPayloadSchemas`, add handler in `handlers.ts`.

### LLM usage pattern

- **Interface**: `packages/llm` exposes `LLMClient` (e.g. `summarizeEmailThread({ subject, messages }) → { summary, actionItems }`).
- **Local dev**: Use `MockLLMProvider` (no API key). Replace with an OpenAI-compatible provider when `OPENAI_API_KEY` (or similar) is set; keep the interface so callers don’t care which provider runs.

### Security rules

- No secrets in code or repo. Tokens/keys in env or secret manager only.
- All tool actions are permissioned and auditable; default to approval for side effects.
- Ingest payloads are untrusted; normalization must be defensive.
- See **docs/security.md** for threat model and token handling.

### Data model and workflows

- **docs/data-model.md**: Entities and relationships (Prisma).
- **docs/workflows.md**: Job patterns, idempotency, normalize flow, tool execution loop.
- **docs/roadmap.md**: v1 milestones and later (OAuth, LinkedIn, Clawdbot-style shell).

### Scripts (repo root)

| Command | Description |
|--------|--------------|
| `pnpm dev` | Run api, web, worker concurrently |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check all |
| `pnpm test` | Run tests (Vitest) |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |

### Commit style

Conventional commits optional but useful: `feat:`, `fix:`, `docs:`, `chore:`.

---

## Quick start (copy-paste)

```bash
git clone https://github.com/henryxoliveira/threaded-nexus-v1 && cd threaded-nexus-v1
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Then: http://localhost:3000 (dashboard), http://localhost:3001/health (API). To test ingest:

```bash
curl -X POST http://localhost:3001/ingest/source-event \
  -H "Content-Type: application/json" \
  -d '{"source":"GMAIL","sourceId":"thread-1","payload":{"threadId":"thread-1","subject":"Test","fromEmail":"alice@example.com"}}'
```

Worker will normalize it; refresh the dashboard to see counts update.
