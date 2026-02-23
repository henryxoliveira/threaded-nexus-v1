# Threaded Nexus — Workflows & Jobs

## Queue: normalize-source-event

- **Producer**: API on `POST /ingest/source-event` (after creating SourceEvent).
- **Consumer**: Worker (BullMQ).
- **Job payload**: `{ sourceEventId: string }`.
- **Behavior**:
  - Load SourceEvent by id.
  - If source is GMAIL: normalize into Person(s), Identity(ies), Interaction (EMAIL_THREAD) with participants. Use `rawRef` (e.g. threadId) for idempotency: if an Interaction with that rawRef already exists, skip creation and only set `processedAt`.
  - If other source: mark processedAt (no normalization yet).
  - On error: set `processingError` and rethrow (BullMQ will retry; after attempts, job fails).
- **Idempotency**: Unique `sourceId` on SourceEvent; unique `(type, value)` on Identity; check existing Interaction by `rawRef` + type before creating. Job id can be `sourceEventId` to avoid duplicate jobs for same event.

## Tool execution loop (worker)

- Worker runs a periodic loop (e.g. every 10s): `getApprovedActions()` → for each, run stub handler → `markExecuted(approvalId)`.
- Only approvals with `status = APPROVED` and `executedAt = null` are returned.
- Handlers are stubs (e.g. log to console); real implementations will call Gmail/Calendar APIs with proper auth.

## Job patterns

- **Retries**: BullMQ default (e.g. 3 attempts) for normalize job.
- **Idempotency**: Normalization must be safe to rerun; use unique constraints and existence checks.
- **Future**: Temporal or more BullMQ queues for sequences, follow-ups, and scheduled tasks (see roadmap).
