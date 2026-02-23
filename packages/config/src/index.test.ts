import { describe, it, expect } from "vitest";
import { loadConfig } from "./index";

describe("config", () => {
  it("loads config with required DATABASE_URL", () => {
    const env = loadConfig({
      DATABASE_URL: "postgresql://local:5432/db",
      REDIS_URL: "redis://localhost:6379",
    });
    expect(env.DATABASE_URL).toBe("postgresql://local:5432/db");
    expect(env.PORT).toBe(3001);
  });

  it("throws when DATABASE_URL missing", () => {
    expect(() => loadConfig({})).toThrow();
  });
});
