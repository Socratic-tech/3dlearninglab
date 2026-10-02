import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";
import type { DB } from "./client";

export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

/** dataDir undefined → in-memory database (tests). */
export async function createPgliteDb(dataDir?: string): Promise<DB> {
  if (dataDir) fs.mkdirSync(path.dirname(path.resolve(dataDir)), { recursive: true });
  const client = dataDir ? new PGlite(path.resolve(dataDir)) : new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db as unknown as DB;
}
