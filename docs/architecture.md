# Threaded Nexus — Architecture

## Overview

Threaded Nexus is an always-on personal CRM + outreach copilot. Events from external sources (Gmail, Google Calendar, later LinkedIn/Discord/Telegram) are ingested, normalized into a canonical data model, and used by LLMs to summarize, extract actions, and propose next steps. Tool actions (send email, create event) go through a permissioned **Tool Gateway** with optional human approval.

## Diagram

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     EXTERNAL SOURCES                     │
                    │  Gmail │ Google Calendar │ (LinkedIn, Discord, etc.)     │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │                  INGEST LAYER                             │
                    │  POST /ingest/source-event  →  SourceEvent (append-only)  │
                    │  Connectors (stubbed): Gmail, GCal                        │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │                  BULLMQ QUEUE                            │
                    │  normalize-source-event                                  │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │                  WORKER                                  │
                    │  • Normalize: SourceEvent → Person, Identity, Interaction │
                    │  • Execute approved tool actions (stub handlers)         │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │                  POSTGRES + REDIS                         │
                    │  Prisma ORM │ pgvector (future)                          │
                    └─────────────────────────────────────────────────────────┘
                                                │
        ┌───────────────────────────────────────┼───────────────────────────────────────┐
        │                                       │                                       │
        ▼                                       ▼                                       ▼
┌───────────────┐                    ┌───────────────────┐                    ┌───────────────┐
│   FASTIFY     │                    │   TOOL GATEWAY   │                    │   NEXT.JS     │
│   API         │◄──────────────────│   request →       │───────────────────►│   WEB         │
│   /health     │                    │   approve →       │                    │   Dashboard   │
│   /debug/stats│                    │   execute         │                    │   /approvals  │
│   /ingest/... │                    │   AuditLog        │                    └───────────────┘
│   /approvals  │                    │   ToolApproval    │
└───────────────┘                    └───────────────────┘
        │
        ▼
┌───────────────┐
│   LLM (stub)  │   summarizeEmailThread, etc. (MockLLMProvider for dev)
└───────────────┘
```

## Components

| Component | Role |
|-----------|------|
| **apps/api** | Fastify HTTP API: ingest, health, debug stats, approvals, tool request. Enqueues normalize jobs. |
| **apps/worker** | BullMQ worker: normalizes SourceEvents into Person/Interaction; polls and executes approved tool actions. |
| **apps/web** | Next.js minimal UI: dashboard counts, approvals list with approve/reject. |
| **packages/core** | Domain enums, Zod schemas, shared constants (e.g. queue name). |
| **packages/db** | Prisma schema, migrations, client. |
| **packages/config** | Env parsing (Zod), single source of config. |
| **packages/integrations** | Connector interfaces + Gmail/GCal stubs (OAuth TODO). |
| **packages/llm** | LLMClient interface, MockLLMProvider; TODO: OpenAI-compatible provider. |
| **packages/tool-gateway** | requestToolAction, approveToolAction, getApprovedActions, markExecuted; Zod-validated tool payloads; stub handlers. |

## Data flow (v1 slice)

1. **Ingest**: Client calls `POST /ingest/source-event` with `{ source, sourceId, payload }`. API writes `SourceEvent`, enqueues job `normalize-source-event` with `sourceEventId`.
2. **Normalize**: Worker picks job, loads SourceEvent; if GMAIL, creates/upserts Person(s) and Identity by email, creates Interaction (EMAIL_THREAD) with participants, idempotent by `rawRef`. Marks `processedAt`.
3. **Tools**: Agent (or API) calls `POST /tools/request` → ToolApproval (PENDING) + AuditLog. User approves in web `/approvals`. Worker periodically fetches APPROVED and not yet executed, runs stub handler, calls `markExecuted`.

## Non-goals (v1)

- No LinkedIn scraping implementation (docs only).
- No Clawdbot/OpenClaw agent shell (mentioned in roadmap).
- OAuth for Gmail/Calendar is stubbed; tokens never in repo.
