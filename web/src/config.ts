/**
 * Runtime configuration.
 * - API URL: each teacher's Apps Script web-app URL. Comes from the class link (?api=...), then is remembered.
 * - Google client ID: one OAuth Web client for this site (VITE_GOOGLE_CLIENT_ID at build time, or ?cid=...).
 */
const KEY_API = "academy.api";
const KEY_CID = "academy.cid";
const KEY_CLASS = "academy.class";

function safeGet(k: string) {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* private mode */ }
}

export function readConfig() {
  const params = new URLSearchParams(location.search);
  const api = params.get("api");
  const cid = params.get("cid");
  const cls = params.get("class");
  if (cls && /^[\w-]{1,40}$/.test(cls)) safeSet(KEY_CLASS, cls);
  if (api && /^https:\/\/script\.google\.com\/(a\/macros\/[\w.-]+|macros)\/s\/[\w-]+\/exec$/.test(api)) safeSet(KEY_API, api.replace(/\/a\/macros\/[\w.-]+\/s\//, "/macros/s/"));
  if (cid) safeSet(KEY_CID, cid);
  if (api || cid || cls) history.replaceState(null, "", location.pathname + location.hash);
  return {
    apiUrl: safeGet(KEY_API),
    clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || safeGet(KEY_CID),
  };
}

export function setApiUrl(url: string) {
  safeSet(KEY_API, url);
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
