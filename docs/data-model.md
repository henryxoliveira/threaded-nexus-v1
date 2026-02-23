# Threaded Nexus — Data Model

Canonical entities and relationships (implemented in Prisma in `packages/db`).

## Entities

### SourceEvent (append-only)

Raw ingested events from connectors.

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| source | string | GMAIL \| GCAL \| MANUAL \| LINKEDIN |
| sourceId | string | Unique per source |
| receivedAt | DateTime | |
| payload | Json | Raw event body |
| processedAt | DateTime? | Set when worker finishes |
| processingError | string? | Set on failure |

### Person

A human in the CRM.

| Field | Type |
|-------|------|
| id | cuid |
| createdAt, updatedAt | DateTime |
| fullName, firstName, lastName | string? |
| primaryEmail | string? |
| linkedinUrl | string? |
| notes | string? |

### Company

| Field | Type |
|-------|------|
| id | cuid |
| name | string |
| domain | string? |

### Identity

Links a Person to an external identifier (email, LinkedIn, phone). Unique on `(type, value)`.

| Field | Type |
|-------|------|
| id | cuid |
| personId | FK → Person |
| type | EMAIL \| LINKEDIN \| PHONE \| OTHER |
| value | string |
| isPrimary | boolean |

### Interaction

A thread, meeting, or note.

| Field | Type |
|-------|------|
| id | cuid |
| type | EMAIL_THREAD \| MEETING \| NOTE |
| occurredAt | DateTime |
| subject | string? |
| summary | string? |
| rawRef | string? (e.g. Gmail thread id) |
| sourceEventId | FK? → SourceEvent |

**Participants**: many-to-many with Person via `InteractionParticipant(interactionId, personId)`.

### Task

| Field | Type |
|-------|------|
| id | cuid |
| title | string |
| status | OPEN \| DONE \| SNOOZED |
| dueAt | DateTime? |
| createdBy | SYSTEM \| USER |
| personId | FK? → Person |
| interactionId | FK? → Interaction |

### AuditLog

Immutable log of who did what.

| Field | Type |
|-------|------|
| id | cuid |
| actor | SYSTEM \| USER \| AGENT |
| action | string |
| targetType | string |
| targetId | string |
| metadata | Json? |
| createdAt | DateTime |

### ToolApproval

Permissioned tool requests.

| Field | Type |
|-------|------|
| id | cuid |
| toolName | string |
| request | Json |
| status | PENDING \| APPROVED \| REJECTED |
| createdAt | DateTime |
| decidedAt | DateTime? |
| decidedBy | string? |
| executedAt | DateTime? |

## Relationships (summary)

- **SourceEvent** → **Interaction** (optional, one-to-many: one event can lead to one interaction in v1).
- **Person** ↔ **Identity** (one-to-many).
- **Interaction** ↔ **Person** (many-to-many via InteractionParticipant).
- **Task** → Person?, Interaction? (optional FKs).
- **AuditLog** and **ToolApproval** are standalone; referenced by targetType/targetId in audit.
