/**
 * Runtime configuration.
 * - API URL: each teacher's Apps Script web-app URL. Comes from the class link (?api=...), then is remembered.
 * - Google client ID: one OAuth Web client for this site (VITE_GOOGLE_CLIENT_ID at build time, or ?cid=...).
 */
const KEY_API = "academy.api";
const KEY_CID = "academy.cid";

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
  if (api && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(api)) safeSet(KEY_API, api);
  if (cid) safeSet(KEY_CID, cid);
  if (api || cid) history.replaceState(null, "", location.pathname + location.hash);
  return {
    apiUrl: safeGet(KEY_API),
    clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || safeGet(KEY_CID),
  };
}

export function setApiUrl(url: string) {
  safeSet(KEY_API, url);
}

export function classLink(apiUrl: string, clientId?: string | null) {
  const u = new URL(location.origin + location.pathname);
  u.searchParams.set("api", apiUrl);
  if (clientId && !import.meta.env.VITE_GOOGLE_CLIENT_ID) u.searchParams.set("cid", clientId);
  return u.toString();
}
