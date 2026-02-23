# Threaded Nexus — Security

## Threat model (v1)

- **Secrets**: OAuth tokens and API keys must never be stored in the repo or in plaintext in the database. Use env vars / secret manager; connectors (Gmail, GCal) will use encrypted-at-rest token storage (TODO).
- **Tool actions**: Sending email, creating calendar events, etc., are sensitive. All such actions go through the **Tool Gateway**: request → (optional) human approval → execution. Every request and decision is logged in **AuditLog**.
- **Ingest**: Ingest API accepts arbitrary `payload`; normalization and worker logic must validate and sanitize. No eval or arbitrary code execution on payload.
- **API**: No auth in v1 (internal/dev). Production will add auth (Google OAuth, session); keep seams clean (e.g. `decidedBy` and actor in audit).

## Token handling

- **Gmail / Google Calendar**: OAuth tokens will be stored in a dedicated store (e.g. encrypted in DB or external vault). Never commit tokens or refresh tokens. TODO: implement OAuth flow and token refresh in connectors.
- **OpenAI / LLM**: API key only in env (`OPENAI_API_KEY`). Not required for local dev (mock provider).

## Approval and audit

- **requestToolAction(toolName, payload)**: Validates payload with Zod, creates `ToolApproval` (PENDING) and `AuditLog` (action: `tool_request`).
- **approveToolAction(id, APPROVED | REJECTED)**: Updates approval, writes `AuditLog` (`tool_approved` / `tool_rejected`).
- **executeApprovedActions** (worker): Runs only APPROVED and not yet executed; after running handler, calls `markExecuted` (sets `executedAt`, writes `tool_executed` to audit).

All tool requests are Zod-validated; unknown tools are rejected.

## Security rules (for LLMs and contributors)

1. No secrets in code or in repo.
2. All tool actions are permissioned and auditable; default to approval-required for side effects.
3. Ingest payloads are not trusted; normalize logic must be defensive.
4. Auth will be added at API and web layer before production; document in roadmap.
