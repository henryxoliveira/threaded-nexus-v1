import type { Connector } from "./connector";
import { SourceKind } from "@threaded-nexus/core";

/**
 * Google Calendar connector stub.
 * TODO: Implement with Google OAuth; same token store as Gmail where applicable.
 */
export class GCalConnector implements Connector {
  readonly name = "gcal";
  readonly source = "GCAL" as SourceKind;

  async start(): Promise<void> {
    // TODO: OAuth + calendar watch or sync
  }

  async stop(): Promise<void> {
    // TODO: cleanup
  }
}
