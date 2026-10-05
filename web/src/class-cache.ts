/**
 * Teacher dashboard data: shown instantly from the last copy, refreshed in the background.
 * Stored under the signed-in teacher's own prefix, so signing out (clearCachedData) removes it on shared computers.
 */
import type { ActionResult } from "@/server/errors";
import { call } from "./api";
import { tokenEmail } from "./auth";

export type Snapshot<T> = { at: number; data: T };

const keyFor = (classId: string) => {
  const email = tokenEmail();
  return email ? `academy.me.${email}.class.${classId}` : null;
};

export function savedClass<T>(classId: string): Snapshot<T> | null {
  const k = keyFor(classId);
  if (!k) return null;
  try {
    const v = JSON.parse(localStorage.getItem(k) ?? "null") as Snapshot<T> | null;
    return v && typeof v.at === "number" && v.data ? v : null;
  } catch {
    return null;
  }
}

const inflight = new Map<string, Promise<ActionResult<unknown>>>();

/** One request per class at a time; a second caller (prefetch + page) shares it. Saves the answer on success. */
export function fetchClass<T>(apiUrl: string, classId: string): Promise<ActionResult<T>> {
  const running = inflight.get(classId);
  if (running) return running as Promise<ActionResult<T>>;
  const p = call<T>(apiUrl, "classData", { classId }).then((r) => {
    inflight.delete(classId);
    const k = keyFor(classId);
    if (r.ok && k) {
      try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), data: r.data })); } catch { /* storage full: still shown */ }
    }
    return r;
  });
  inflight.set(classId, p as Promise<ActionResult<unknown>>);
  return p;
}
