/**
 * Background saving. Students never wait on Google: work goes into a queue on the device and uploads in order,
 * retrying until it sticks. The queue survives reloads, closed tabs and Wi-Fi drops (localStorage, per student).
 *
 * - Each item keeps its requestId, so a retry after a lost reply is recognised by Apps Script and not done twice.
 * - Items with the same `coalesce` key replace each other (drafts, journal autosave): only the latest is sent.
 * - Errors the server *means* (validation, locked lesson…) drop the item and are reported; network/Google hiccups retry.
 * - A "sign-in expired" pauses the queue until the student signs in again.
 */
import type { ActionResult } from "@/server/errors";
import { callOnce } from "./api";
import { studentViewOn } from "./state";

export type QueueItem = { id: string; action: string; args: Record<string, unknown>; coalesce?: string; tries: number; at: number };
export type SyncState = { pending: number; status: "idle" | "saving" | "offline" | "signin"; lastError: string | null };

const listeners = new Set<() => void>();
let state: SyncState = { pending: 0, status: "idle", lastError: null };
let apiUrl: string | null = null;
let owner = "anon";
let items: QueueItem[] = [];
let running = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const waiters = new Map<string, (r: ActionResult<unknown>) => void>();
const errorHandlers = new Set<(msg: string, item: QueueItem) => void>();

const key = () => `academy.queue.${owner}`;
function persist() {
  try { localStorage.setItem(key(), JSON.stringify(items)); } catch { /* storage full or private mode: keep in memory */ }
}
function load() {
  try { items = JSON.parse(localStorage.getItem(key()) ?? "[]"); } catch { items = []; }
}
function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch, pending: items.length };
  listeners.forEach((f) => f());
}

export const syncState = () => state;
export function subscribeSync(f: () => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}
export function onSyncError(f: (msg: string, item: QueueItem) => void) {
  errorHandlers.add(f);
  return () => { errorHandlers.delete(f); };
}

/** Point the queue at a class API and a student; resumes anything left from last time. */
export function startSync(url: string, email: string) {
  if (apiUrl === url && owner === email) return;
  apiUrl = url;
  owner = email || "anon";
  load();
  set({ status: items.length ? "saving" : "idle", lastError: null });
  kick(0);
}

/**
 * Queue a request. Resolves with the server's answer when it is processed (callers that don't need it can ignore
 * the promise). Coalesced items resolve with the newest item's result.
 */
export function enqueue<T>(action: string, args: Record<string, unknown>, coalesce?: string): Promise<ActionResult<T>> {
  // remember whose work this is (teacher or their test student), even if Student view is switched before it uploads
  const item: QueueItem = { id: crypto.randomUUID(), action, args: { asStudent: studentViewOn(), ...args }, coalesce, tries: 0, at: Date.now() };
  if (coalesce) {
    const old = items.findIndex((x) => x.coalesce === coalesce && !inFlight.has(x.id));
    if (old >= 0) {
      const prev = items[old];
      items.splice(old, 1);
      const w = waiters.get(prev.id);
      waiters.delete(prev.id);
      if (w) promiseFor<T>(item.id).then((r) => w(r as ActionResult<unknown>));
    }
  }
  items.push(item);
  persist();
  set({ status: state.status === "signin" ? "signin" : "saving" });
  const p = promiseFor<T>(item.id);
  kick(0);
  return p;
}

const inFlight = new Set<string>();
function promiseFor<T>(id: string): Promise<ActionResult<T>> {
  return new Promise((resolve) => {
    const prev = waiters.get(id);
    waiters.set(id, (r) => { prev?.(r); resolve(r as ActionResult<T>); });
  });
}

function kick(ms: number) {
  clearTimeout(timer);
  timer = setTimeout(() => void run(), ms);
}

const backoff = (tries: number) => Math.min(60_000, 1500 * 2 ** Math.min(tries, 6));

async function run() {
  if (running || !apiUrl) return;
  running = true;
  try {
    while (items.length) {
      const item = items[0];
      inFlight.add(item.id);
      const r = await callOnce<unknown>(apiUrl, item.action, item.args, item.id);
      inFlight.delete(item.id);
      if (r.ok) {
        items.shift();
        persist();
        waiters.get(item.id)?.(r);
        waiters.delete(item.id);
        set({ status: items.length ? "saving" : "idle", lastError: null });
        continue;
      }
      if (/sign-in expired|Please sign in/i.test(r.error)) {
        set({ status: "signin", lastError: r.error });
        return; // resumes on the next enqueue/resume() after signing in
      }
      if (r.retryable) {
        item.tries++;
        persist();
        set({ status: navigator.onLine === false || item.tries > 2 ? "offline" : "saving", lastError: r.error });
        kick(backoff(item.tries));
        return;
      }
      // the server deliberately refused (validation etc.): drop it and tell the page
      items.shift();
      persist();
      waiters.get(item.id)?.(r);
      waiters.delete(item.id);
      errorHandlers.forEach((f) => f(r.error, item));
      set({ status: items.length ? "saving" : "idle", lastError: r.error });
    }
  } finally {
    running = false;
  }
}

/** Try again now (after signing in, coming back online or returning to the tab). */
export function resumeSync() {
  if (items.length) { set({ status: "saving" }); kick(0); }
}

/** Promise that resolves when everything queued so far has been saved (or the queue gave up for now). */
export function whenSaved(timeoutMs = 15000): Promise<boolean> {
  if (!items.length) return Promise.resolve(true);
  return new Promise((resolve) => {
    const t = setTimeout(() => { off(); resolve(false); }, timeoutMs);
    const off = subscribeSync(() => {
      if (!items.length) { clearTimeout(t); off(); resolve(true); }
    });
  });
}

export const pendingItems = () => items.slice();

if (typeof window !== "undefined") {
  addEventListener("online", resumeSync);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") resumeSync(); });
}
