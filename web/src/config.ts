/**
 * Runtime configuration.
 * - API URL: each teacher's Apps Script web-app URL. Comes from the class link (?api=...), then is remembered.
 * - Google client ID: one OAuth Web client for this site (VITE_GOOGLE_CLIENT_ID at build time, or ?cid=...).
 *
 * Everything is kept in memory as well as localStorage: on managed Chromebooks, some private windows and strict
 * privacy settings, storage is blocked, and the link's values must still work for this visit.
 */
const KEY_API = "academy.api";
const KEY_CID = "academy.cid";
const KEY_CLASS = "academy.class";

const memory = new Map<string, string>();

function safeGet(k: string) {
  try {
    const v = localStorage.getItem(k);
    if (v != null) return v;
  } catch { /* storage blocked */ }
  return memory.get(k) ?? null;
}
/** Returns false when the browser wouldn't keep it (memory still has it for this visit). */
function safeSet(k: string, v: string) {
  memory.set(k, v);
  try { localStorage.setItem(k, v); return true; } catch { return false; }
}

/**
 * Turns any form of an Apps Script web-app address into the canonical public one, or null if it isn't one.
 * Accepts Workspace (/a/macros/<domain>/), multi-account (/u/1/) and stray spaces/trailing slashes.
 */
export function normalizeApiUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^https:\/\/script\.google\.com\/(?:a\/macros\/[\w.-]+|macros)(?:\/u\/\d+)?\/s\/([\w-]+)\/exec\/?(?:[?#].*)?$/);
  return m ? `https://script.google.com/macros/s/${m[1]}/exec` : null;
}

export function readConfig() {
  const params = new URLSearchParams(location.search);
  const api = params.get("api");
  const cid = params.get("cid");
  const cls = params.get("class");
  let kept = true;
  if (cls && /^[\w-]{1,40}$/.test(cls)) kept = safeSet(KEY_CLASS, cls) && kept;
  const apiUrl = normalizeApiUrl(api);
  if (apiUrl) kept = safeSet(KEY_API, apiUrl) && kept;
  if (cid) kept = safeSet(KEY_CID, cid.trim()) && kept;
  // Tidy the address bar only once the browser has saved the link; otherwise leave it so refresh/bookmarks still work.
  if ((api || cid || cls) && kept) history.replaceState(null, "", location.pathname + location.hash);
  return {
    apiUrl: normalizeApiUrl(safeGet(KEY_API)),
    clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || safeGet(KEY_CID),
  };
}

/** Saves a pasted app address; returns false if it isn't a web-app address. */
export function setApiUrl(url: string) {
  const clean = normalizeApiUrl(url);
  if (clean) safeSet(KEY_API, clean);
  return !!clean;
}

export function setClientId(id: string) {
  if (id.trim()) safeSet(KEY_CID, id.trim());
}

/** The class this browser is looking at (from the class link, or the last one chosen). */
export function currentClassId(): string | null {
  return safeGet(KEY_CLASS);
}
export function setCurrentClassId(id: string) {
  safeSet(KEY_CLASS, id);
}

export function classLink(apiUrl: string, clientId: string | null | undefined, classId: string) {
  const u = new URL(location.origin + location.pathname);
  u.searchParams.set("api", apiUrl);
  u.searchParams.set("class", classId);
  if (clientId && !import.meta.env.VITE_GOOGLE_CLIENT_ID) u.searchParams.set("cid", clientId);
  return u.toString();
}
