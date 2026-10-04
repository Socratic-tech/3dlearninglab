/** Offers an immediate refresh when the Sheet's cached website bundle is behind. */
import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { call } from "../api";
import type { Me } from "../content";

type Latest = { version: string; notes?: string };
type Result = { ok: boolean; version?: string; needsPaste?: boolean; pasteUrl?: string | null; error?: string };
const PASTE_URL = `${import.meta.env.BASE_URL}apps-script/paste.html`;
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
      .catch(() => { /* offline: the loader keeps using its cached bundle */ });
    return () => { live = false; };
  }, []);

  const mine = me.app?.version;
  const outdated = !!latest && mine !== "dev" && mine !== latest.version;
  if (me.user.role !== "teacher" || (!outdated && !result)) return null;
  if (hidden && !result) return null;

  if (result?.ok) {
    return wrap(
      <Alert tone="success" title={`Updated to ${result.version}`}>
        The loader has cached the newest app. Students do not need to do anything.
      </Alert>,
    );
  }

  const owner = me.app?.owner;
  const isOwner = !owner || owner === me.user.email.toLowerCase();

  if (!me.app) {
    return wrap(
      <Alert tone="warning" title="Install the two-file loader once">
        <p>{isOwner ? "This Sheet" : `The Sheet owned by ${owner}`} still uses the old multi-file setup. After this one-time change, the app updates itself.</p>
        <a className="mt-2 inline-block font-semibold underline" href={PASTE_URL} target="_blank" rel="noreferrer">Show me how</a>
      </Alert>,
    );
  }

  return wrap(
    <Alert tone="warning" title="A new version is available">
      {latest?.notes && <p>{latest.notes}</p>}
      <p className="mt-1 text-sm">The loader normally updates automatically. You can refresh it now; links and student work stay the same.</p>
      {result?.needsPaste && (
        <p className="mt-2 rounded-lg bg-surface p-3 text-sm">
          {isOwner ? "This copy" : `The Sheet owned by ${owner}`} needs the one-time{" "}
          <a className="font-semibold underline" href={result.pasteUrl || PASTE_URL} target="_blank" rel="noreferrer">two-file loader installation</a>.
        </p>
      )}
      {result && !result.ok && !result.needsPaste && <p className="mt-2 text-sm text-danger">{result.error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void update()}>{busy ? "Updating…" : "Update now"}</Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={later}>Later</Button>
      </div>
    </Alert>,
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
    const response = await call<Result>(apiUrl, "updateApp");
    setBusy(false);
    const next = response.ok ? response.data : { ok: false, error: response.error };
    setResult(next);
    if (next.ok) onUpdated();
  }
}
