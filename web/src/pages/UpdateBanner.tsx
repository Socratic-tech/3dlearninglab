/**
 * Teacher dashboard: "Update available" when the website has a newer app than the one installed in the Sheet.
 * Loader 2 installs only when a teacher clicks Update now (safety-checked first) and offers Undo.
 * Older Sheets get a one-time paste of the new loader.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { call } from "../api";
import type { Me } from "../content";

type Latest = { version: string; notes?: string };
type Result = { ok: boolean; version?: string; same?: boolean; undone?: boolean; needsPaste?: boolean; pasteUrl?: string | null; error?: string };
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
  const needsMigration = me.app?.safeUpdates !== true;
  const previous = me.app?.previous ?? null;
  if (me.user.role !== "teacher" || (!needsMigration && !outdated && !result)) return null;
  if (hidden && !result) return null;

  if (result?.ok) {
    return wrap(
      <Alert tone="success" title={result.undone ? `Back to version ${result.version}` : result.same ? `You already have version ${result.version}` : `Updated to ${result.version}`}>
        <p>It passed its safety check{result.undone ? "" : " before installing"}. Students don&rsquo;t need to do anything.</p>
        {!result.undone && !result.same && (
          <Button variant="secondary" size="sm" className="mt-2" disabled={busy} onClick={() => void undo()}>Undo this update</Button>
        )}
      </Alert>,
    );
  }

  const owner = me.app?.owner;
  const isOwner = !owner || owner === me.user.email.toLowerCase();

  if (needsMigration) {
    return wrap(
      <Alert tone="warning" title="Paste the new loader once">
        <p>{isOwner ? "This Sheet" : `The Sheet owned by ${owner}`} needs a one-time paste. After that, app updates install only when you click Update now, each one is safety-checked first, and you can undo it.</p>
        <a className="mt-2 inline-block font-semibold underline" href={PASTE_URL} target="_blank" rel="noreferrer">Show me how</a>
      </Alert>,
    );
  }

  return wrap(
    <Alert tone="warning" title="Update available">
      {latest?.notes && <p>{latest.notes}</p>}
      <p className="mt-1 text-sm">It&rsquo;s checked before it installs, and you can undo it. Links and student work stay the same. Lesson changes don&rsquo;t need this — they arrive by themselves.</p>
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
        {previous && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void undo()}>Undo last update ({previous})</Button>}
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
  async function undo() {
    setBusy(true);
    const response = await call<Result>(apiUrl, "undoUpdate");
    setBusy(false);
    const next = response.ok ? { ...response.data, undone: response.data.ok } : { ok: false, error: response.error };
    setResult(next);
    if (next.ok) onUpdated();
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
