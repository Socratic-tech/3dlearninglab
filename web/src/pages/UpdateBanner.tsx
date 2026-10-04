/**
 * "Your class app is out of date" banner on the teacher dashboard.
 *
 * The website updates itself when it is published; each teacher's Apps Script copy does not. The site publishes
 * apps-script/version.json, and `me.app.version` says what this copy runs. When they differ, teachers get a
 * one-click update (the same as the Sheet sidebar's Update now). Copies from before this feature don't send
 * `me.app`, so they get directions to the sidebar instead.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { call } from "../api";
import type { Me } from "../content";

type Latest = { version: string; notes?: string };
type Result = { ok: boolean; version?: string; redeployed?: boolean; needsApi?: boolean; error?: string };
const DISMISS = "academy.update.later";

export function UpdateBanner({ me, apiUrl, onUpdated }: { me: Me; apiUrl: string; onUpdated: () => void }) {
  const [latest, setLatest] = useState<Latest | null>(null);
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(DISMISS) === "1"; } catch { return false; }
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`${import.meta.env.BASE_URL}apps-script/version.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Latest | null) => { if (live && v?.version) setLatest(v); })
      .catch(() => { /* offline or not published: no banner */ });
    return () => { live = false; };
  }, []);

  const mine = me.app?.version;
  const outdated = !!latest && mine !== "dev" && mine !== latest.version;
  if (me.user.role !== "teacher" || (!outdated && !result)) return null;
  if (hidden && !result) return null;

  if (result?.ok) {
    return wrap(
      <Alert tone="success" title={`Updated to ${result.version}`}>
        {result.redeployed
          ? "Your class app is already using it. Students don't need to do anything."
          : "One last step in Apps Script: Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy."}
      </Alert>
    );
  }

  const owner = me.app?.owner;
  const isOwner = !owner || owner === me.user.email.toLowerCase();

  // Copies older than this banner can't update from here: point to the sidebar.
  if (!me.app) {
    return wrap(
      <Alert tone="warning" title="Your class app needs an update">
        <p>New lessons and fixes won&rsquo;t save correctly until it&rsquo;s updated. In your class Google Sheet, open <b>3D Design Academy → Set up &amp; class links</b> and click <b>Update now</b> at the bottom. After this one time, you can update right here.</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={later}>Remind me later</Button>
      </Alert>
    );
  }

  return wrap(
    <Alert tone="warning" title="A new version of your class app is ready">
      {latest?.notes && <p>{latest.notes}</p>}
      <p className="mt-1 text-sm">New lessons and fixes won&rsquo;t save correctly until you update. Links and student work stay the same.</p>
      {result?.needsApi && (
        <p className="mt-2 rounded-lg bg-surface p-3 text-sm">
          {isOwner ? "One-time switch:" : `One-time switch for the Sheet's owner (${owner}):`} open{" "}
          <a className="font-semibold underline" href="https://script.google.com/home/usersettings" target="_blank" rel="noreferrer">Apps Script settings</a>, turn <b>Google Apps Script API</b> on, then click Update now again.
        </p>
      )}
      {result && !result.ok && !result.needsApi && <p className="mt-2 text-sm text-danger">{result.error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void update()}>{busy ? "Updating… (about 20 seconds)" : "Update now"}</Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={later}>Later</Button>
      </div>
    </Alert>
  );

  function wrap(node: ReactNode) {
    return <div className="mb-4">{node}</div>;
  }
  function later() {
    try { sessionStorage.setItem(DISMISS, "1"); } catch { /* ignore */ }
    setHidden(true);
  }
  async function update() {
    setBusy(true);
    const r = await call<Result>(apiUrl, "updateApp");
    setBusy(false);
    const res = r.ok ? r.data : { ok: false, error: r.error };
    setResult(res);
    if (res.ok) onUpdated();
  }
}
