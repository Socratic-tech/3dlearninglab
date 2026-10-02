import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { env } from "../env";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

type Holder = { db?: Promise<DB>; override?: DB };
const g = globalThis as unknown as { __academyDb?: Holder };
const holder: Holder = (g.__academyDb ??= {});

/**
 * Returns the process-wide database.
 * - DATABASE_URL set → postgres-js (Supabase/any Postgres). Migrations are run by `npm run db:migrate`.
 * - otherwise → embedded PGlite stored in PGLITE_DIR, auto-migrated and auto-seeded with demo data.
 */
export function getDb(): Promise<DB> {
  if (holder.override) return Promise.resolve(holder.override);
  holder.db ??= createDb().catch((e) => {
    holder.db = undefined; // don't cache a failed connection
    throw e;
  });
  return holder.db;
}

/** Test hook: point the app at an isolated database. */
export function setDbForTests(db: DB | undefined) {
  holder.override = db;
}

async function createDb(): Promise<DB> {
  if (env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    // prepare:false keeps us compatible with Supabase's transaction pooler (pgbouncer).
    const client = postgres(env.DATABASE_URL, { prepare: false, max: env.DATABASE_POOL_MAX });
    return drizzle(client, { schema }) as unknown as DB;
  }
  const { createPgliteDb } = await import("./pglite");
  const db = await createPgliteDb(env.PGLITE_DIR);
  const { ensureSeeded } = await import("./seed");
  await ensureSeeded(db);
  return db;
}
