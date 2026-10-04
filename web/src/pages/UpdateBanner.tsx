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
const PASTE_URL = `${import.meta.env.BASE_URL}apps-script/paste.html`;

type Result = { ok: boolean; version?: string; redeployed?: boolean; needsPaste?: boolean; pasteUrl?: string | null; error?: string };
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
        Your class app is already using it. Students don&rsquo;t need to do anything.
      </Alert>
    );
  }

  const owner = me.app?.owner;
  const isOwner = !owner || owner === me.user.email.toLowerCase();

  // Copies older than this banner can't update from here: point to the sidebar.
  if (!me.app) {
    return wrap(
      <Alert tone="warning" title="Your class app needs an update">
        <p>New lessons and fixes won&rsquo;t save correctly until it&rsquo;s updated. It&rsquo;s a one-time copy and paste (about 2 minutes). After that, your Sheet updates itself.</p>
        <a className="mt-2 inline-block font-semibold underline" href={PASTE_URL} target="_blank" rel="noreferrer">Show me how</a>
        <Button variant="secondary" size="sm" className="mt-2" onClick={later}>Remind me later</Button>
      </Alert>
    );
  }

  return wrap(
    <Alert tone="warning" title="A new version of your class app is ready">
      {latest?.notes && <p>{latest.notes}</p>}
      <p className="mt-1 text-sm">New lessons and fixes won&rsquo;t save correctly until you update. Links and student work stay the same.</p>
      {result?.needsPaste && (
        <p className="mt-2 rounded-lg bg-surface p-3 text-sm">
          {isOwner ? "This copy needs a one-time update:" : `The Sheet's owner (${owner}) needs to do a one-time update:`}{" "}
          <a className="font-semibold underline" href={result.pasteUrl || PASTE_URL} target="_blank" rel="noreferrer">copy and paste one script</a> (about 2 minutes). After that, it updates itself.
        </p>
      )}
      {result && !result.ok && !result.needsPaste && <p className="mt-2 text-sm text-danger">{result.error}</p>}
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
