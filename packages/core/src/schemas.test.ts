import { describe, it, expect } from "vitest";
import { IngestSourceEventSchema } from "./schemas";

describe("IngestSourceEventSchema", () => {
  it("accepts valid GMAIL event", () => {
    const result = IngestSourceEventSchema.safeParse({
      source: "GMAIL",
      sourceId: "thread-123",
      payload: { threadId: "thread-123", subject: "Hello" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid source", () => {
    const result = IngestSourceEventSchema.safeParse({
      source: "INVALID",
      sourceId: "x",
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});
