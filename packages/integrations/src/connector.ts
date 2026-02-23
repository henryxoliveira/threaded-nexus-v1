import type { SourceKind } from "@threaded-nexus/core";

/**
 * Raw event shape as produced by a connector (e.g. Gmail webhook payload).
 * Normalization into SourceEvent + canonical entities happens in the worker.
 */
export interface RawConnectorEvent {
  source: SourceKind;
  sourceId: string;
  payload: Record<string, unknown>;
}

/**
 * Connector interface: fetch or receive events from an external source.
 * v1: Gmail/Calendar connectors are stubbed; implementation uses OAuth (TODO).
 */
export interface Connector {
  readonly name: string;
  readonly source: SourceKind;
  /** Optional: start listening for real-time events (webhooks/polling). */
  start?(): Promise<void>;
  /** Optional: stop listening. */
  stop?(): Promise<void>;
}
