import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getDb, type DB } from "@/server/db/client";
import { requireUser, type CurrentUser, type Role } from "@/server/auth/session";
import { toActionError, type ActionResult } from "@/server/errors";
import type { Actor } from "@/server/policy";

export const actorOf = (u: CurrentUser): Actor => ({ id: u.id, role: u.role, organizationId: u.organizationId });

/**
 * Wraps every Server Action: authenticates, authorizes by role, and converts errors into friendly results.
 * Redirects/notFound thrown by Next are re-thrown.
 */
export async function run<T>(roles: Role[], fn: (ctx: { db: DB; user: CurrentUser; actor: Actor }) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const user = await requireUser(...roles);
    const db = await getDb();
    const data = await fn({ db, user, actor: actorOf(user) });
    return { ok: true, data };
  } catch (e) {
    unstable_rethrow(e);
    return toActionError(e);
  }
}

export function str(fd: FormData, key: string, max = 2000): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.slice(0, max) : "";
}

export async function fileFrom(fd: FormData, key: string) {
  const f = fd.get(key);
  if (!f || typeof f === "string" || f.size === 0) return undefined;
  return { name: f.name, type: f.type, body: Buffer.from(await f.arrayBuffer()) };
}
