import { z } from "zod";

export const SourceKind = z.enum(["GMAIL", "GCAL", "MANUAL", "LINKEDIN"]);
export type SourceKind = z.infer<typeof SourceKind>;

export const IdentityType = z.enum(["EMAIL", "LINKEDIN", "PHONE", "OTHER"]);
export type IdentityType = z.infer<typeof IdentityType>;

export const InteractionType = z.enum(["EMAIL_THREAD", "MEETING", "NOTE"]);
export type InteractionType = z.infer<typeof InteractionType>;

export const TaskStatus = z.enum(["OPEN", "DONE", "SNOOZED"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskCreatedBy = z.enum(["SYSTEM", "USER"]);
export type TaskCreatedBy = z.infer<typeof TaskCreatedBy>;

export const AuditActor = z.enum(["SYSTEM", "USER", "AGENT"]);
export type AuditActor = z.infer<typeof AuditActor>;

export const ToolApprovalStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type ToolApprovalStatus = z.infer<typeof ToolApprovalStatus>;

/** Ingest: body for POST /ingest/source-event */
export const IngestSourceEventSchema = z.object({
  source: SourceKind,
  sourceId: z.string().min(1),
  payload: z.record(z.unknown()),
});

export type IngestSourceEvent = z.infer<typeof IngestSourceEventSchema>;

/** BullMQ queue name for normalizing source events */
export const NORMALIZE_SOURCE_EVENT_QUEUE = "normalize-source-event";
