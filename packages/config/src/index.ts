import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  PORT: z.coerce.number().default(3001),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
});

export type Env = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(env);
}

export { envSchema };
