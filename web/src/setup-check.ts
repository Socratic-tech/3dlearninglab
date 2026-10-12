/**
 * "Check my setup": plain-language checks for the problems teachers actually hit when setting up alone
 * (wrong app address, web app not open to Anyone, Sheet not updated, an old pinned deployment, sign-in).
 * The first two checks work even when nothing else does, so this can run from the error and setup screens.
 */
import { call } from "./api";
import { currentToken, tokenExpiresAt } from "./auth";
import { normalizeApiUrl } from "./config";

export type Check = { id: string; label: string; status: "ok" | "warn" | "fail"; detail: string; fix?: string };
type Diagnose = {
  version: string; latest: string | null; upToDate: boolean; viaLoader: boolean; loaderCurrent: boolean; webAppUrl: string | null;
  clientIdSet: boolean; owner: string; you: string; allowedDomains: string[]; classes: number; content: string; engineBehind: boolean;
};

const UPDATE_NOW = "Open your class Sheet → 3D Design Academy → Set up & class links, then click Update now in the side panel.";

export async function runSetupChecks(rawApiUrl: string | null): Promise<Check[]> {
  const out: Check[] = [];
  const apiUrl = normalizeApiUrl(rawApiUrl);
  if (!apiUrl) {
    out.push({ id: "address", label: "App address", status: "fail", detail: "This browser doesn't have a valid app address for your class Sheet.", fix: "Open your Sheet → 3D Design Academy → Set up & class links → Open my dashboard. That link brings the address with it." });
    return out;
  }
  out.push({ id: "address", label: "App address", status: "ok", detail: "This browser knows your class Sheet's address." });

  // 1) Can the website reach the Sheet without a sign-in? (proves the web app exists and is open to Anyone)
  const started = Date.now();
  try {
    const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "heartbeat" }) });
    const text = await res.text();
    let json = false;
    try { JSON.parse(text); json = true; } catch { /* an HTML page */ }
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    if (json) out.push({ id: "reach", label: "Website can reach your Sheet", status: "ok", detail: `Your Sheet answered in ${secs} s.` });
    else out.push({ id: "reach", label: "Website can reach your Sheet", status: "fail", detail: `Google answered with a web page instead of your Sheet (HTTP ${res.status}). Usually the web app isn't open to everyone, or it was deleted.`, fix: "In your Sheet: Extensions → Apps Script → Deploy → Manage deployments → ✏️ Edit. Set Execute as: Me and Who has access: Anyone, then Deploy." });
  } catch {
    out.push({ id: "reach", label: "Website can reach your Sheet", status: "fail", detail: "The request didn't get through. The address may be wrong, or this network blocks script.google.com.", fix: "Open your dashboard again from the Sheet's side panel (Open my dashboard). If it still fails, try another network." });
    return out;
  }

  // 2) Signed-in checks: what the Sheet is running
  if (!currentToken()) {
    out.push({ id: "signin", label: "Google sign-in", status: "warn", detail: "You're not signed in, so the rest of the checks can't run.", fix: "Sign in, then run Check my setup again." });
    return out;
  }
  const mins = Math.round((tokenExpiresAt() - Date.now()) / 60000);
  out.push({ id: "signin", label: "Google sign-in", status: "ok", detail: `Signed in (renews automatically; ${Math.max(0, mins)} min left on this sign-in).` });

  const r = await call<Diagnose>(apiUrl, "diagnose");
  if (!r.ok) {
    const old = /Unknown request|Solicitud desconocida/.test(r.error);
    out.push(old
      ? { id: "version", label: "Sheet is up to date", status: "fail", detail: "Your Sheet is running an older copy of the app that doesn't know this check.", fix: UPDATE_NOW }
      : /access/i.test(r.error)
        ? { id: "teacher", label: "Teacher access", status: "fail", detail: "This Google account isn't a teacher for this Sheet.", fix: "Ask the Sheet's owner to add your email under Settings → Teacher emails in the side panel, or open the right teacher's Sheet." }
        : { id: "diagnose", label: "Sheet check", status: "fail", detail: r.error, fix: "Try again in a minute. If it keeps failing, click Update now in the side panel." });
    return out;
  }
  const d = r.data;
  out.push(d.upToDate
    ? { id: "version", label: "Sheet is up to date", status: "ok", detail: `Running version ${d.version}.` }
    : { id: "version", label: "Sheet is up to date", status: "warn", detail: `Your Sheet runs ${d.version}; ${d.latest} is available.`, fix: UPDATE_NOW });
  if (d.viaLoader && !d.loaderCurrent) {
    out.push({ id: "deployment", label: "Web app runs current code", status: "warn", detail: "The website talks to a very old saved version (deployment) of your Sheet's script that can't install updates safely.", fix: "In your Sheet: Extensions → Apps Script → Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy. Your links stay the same. If this still shows, paste the newest Code.gs from the update page once." });
  } else out.push({ id: "deployment", label: "Web app runs current code", status: "ok", detail: "The website and the side panel run the same app." });
  out.push(d.clientIdSet
    ? { id: "client", label: "Sign-in is connected to this website", status: "ok", detail: "Google sign-in is set up for this site." }
    : { id: "client", label: "Sign-in is connected to this website", status: "fail", detail: "The Sheet doesn't know this website's Google sign-in ID.", fix: "Click Update now in the side panel. If that doesn't fix it, ask whoever set up the site for the sign-in client ID." });
  out.push(d.allowedDomains.length
    ? { id: "domains", label: "Only your school's accounts", status: "ok", detail: `Sign-in limited to: ${d.allowedDomains.join(", ")}.` }
    : { id: "domains", label: "Only your school's accounts", status: "warn", detail: "Any Google account on your roster can sign in, including personal accounts.", fix: "In the side panel → Settings, enter your school's email domain (for example berrienresa.org) and save." });
  if (d.engineBehind) out.push({ id: "lessons", label: "Newest lessons", status: "warn", detail: "New lessons are published that your Sheet's version can't show yet.", fix: UPDATE_NOW });
  if (d.classes === 0) out.push({ id: "classes", label: "A class exists", status: "warn", detail: "You haven't made a class yet.", fix: "Teacher → Classes → New class, or use the side panel." });
  return out;
}
