/**
 * Stub tool handlers for v1. Real implementations will call Gmail/Calendar APIs.
 */

export type ToolHandler = (request: object) => Promise<void>;

export const stubHandlers: Record<string, ToolHandler> = {
  send_email: async (request) => {
    // Stub: real implementation will call Gmail API (see docs/roadmap.md)
    void request;
  },
  create_calendar_event: async (request) => {
    // Stub: real implementation will call Calendar API (see docs/roadmap.md)
    void request;
  },
};
