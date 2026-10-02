import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional().transform((v) => (v ? v : undefined)),
  DATABASE_POOL_MAX: z.coerce.number().default(5),
  PGLITE_DIR: z.string().default(".data/pglite"),
  /** 32-byte key, base64. Encrypts OAuth tokens and signs file URLs. */
  APP_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  DEMO_MODE: bool,
  STORAGE_PROVIDER: z.enum(["local", "supabase"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default(".data/uploads"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("academy-private"),
  MAX_UPLOAD_MB: z.coerce.number().default(25),
  /** Use an in-memory fake Classroom API (development / e2e). */
  CLASSROOM_FAKE: bool,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — see .env.example");
}

export const env = parsed.data;

export const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

/** Demo mode is always on in development unless explicitly disabled. */
export const demoEnabled =
  env.DEMO_MODE || (env.NODE_ENV !== "production" && process.env.DEMO_MODE !== "false");

export function appSecret(): Buffer {
  if (env.APP_SECRET) {
    const key = Buffer.from(env.APP_SECRET, "base64");
    if (key.length !== 32) throw new Error("APP_SECRET must be 32 bytes, base64 encoded");
    return key;
  }
  if (env.NODE_ENV === "production") throw new Error("APP_SECRET is required in production");
  // Development-only deterministic key. Never used in production.
  return Buffer.alloc(32, 7);
}
