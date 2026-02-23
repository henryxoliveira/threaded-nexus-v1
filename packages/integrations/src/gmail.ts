import type { Connector } from "./connector";
import { SourceKind } from "@threaded-nexus/core";

/**
 * Gmail connector stub.
 * TODO: Implement with Google OAuth; tokens must never be stored in repo.
 * Will consume Gmail API (threads/messages) or push webhooks.
 */
export class GmailConnector implements Connector {
  readonly name = "gmail";
  readonly source = "GMAIL" as SourceKind;

  async start(): Promise<void> {
    // TODO: OAuth flow + watch mailbox or poll
  }

  async stop(): Promise<void> {
    // TODO: cleanup
  }
}
