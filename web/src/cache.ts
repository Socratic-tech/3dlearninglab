/**
 * Instant page loads: the last copy of a student's data is shown right away and refreshed in the background.
 * Kept per signed-in email so a shared Chromebook never shows one student another's work.
 */
import type { Me } from "./content";
import { pendingItems } from "./sync";

const meKey = (api: string, email: string) => `academy.me.${email}.${api.slice(-24)}`;

export function cachedMe(api: string, email: string | null): Me | null {
  if (!email) return null;
  try {
    const v = localStorage.getItem(meKey(api, email));
    return v ? (JSON.parse(v) as Me) : null;
  } catch {
    return null;
  }
}

export function saveMe(api: string, email: string | null, me: Me) {
  if (!email) return;
  try { localStorage.setItem(meKey(api, email), JSON.stringify(me)); } catch { /* full: skip */ }
}

export function clearCachedData(email: string | null) {
  if (!email) return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`academy.me.${email}.`)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

/** Layer work that hasn't reached Google yet on top of what Google last told us. */
export function withPending(me: Me): Me {
  const items = pendingItems();
  if (!items.length) return me;
  const progress = { ...me.progress };
  for (const it of items) {
    const a = it.args as { lessonId?: string; blockId?: string; local?: Record<string, unknown>; text?: string };
    if (!a.lessonId) continue;
    const p = progress[a.lessonId] ?? { status: "in_progress", blockState: {} };
    const blockState = { ...(p.blockState ?? {}) } as Record<string, Record<string, unknown>>;
    if (it.action === "answerBlock" && a.blockId && a.local) blockState[a.blockId] = { ...(blockState[a.blockId] ?? {}), ...a.local };
    if (it.action === "submitReflection" && a.blockId) blockState[a.blockId] = { ...(blockState[a.blockId] ?? {}), response: { text: a.text }, done: true };
    if (it.action === "saveDraft" && a.blockId && !(blockState[a.blockId] as { done?: boolean } | undefined)?.done) blockState[a.blockId] = { ...(blockState[a.blockId] ?? {}), response: { draft: a.text } };
    progress[a.lessonId] = { ...p, status: it.action === "completeLesson" ? "completed" : p.status === "completed" ? "completed" : "in_progress", blockState };
  }
  return { ...me, progress };
}
