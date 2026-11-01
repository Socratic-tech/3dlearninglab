/**
 * Teacher dashboard: "Update available" when the website has a newer app than the one installed in the Sheet.
 * Loader 2 installs only when a teacher clicks Update now (safety-checked first) and offers Undo. Loader 1 updates by
 * itself, so it is never asked for anything. Only a Sheet with no loader (the whole app pasted in, before October
 * 2026) can't update and is asked for the one-time paste.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { call } from "../api";
import type { Me } from "../content";
import { isLocalApi } from "../config";

type Latest = { version: string; notes?: string };
type Result = { ok: boolean; version?: string; same?: boolean; undone?: boolean; needsPaste?: boolean; pasteUrl?: string | null; error?: string };
const PASTE_URL = `${import.meta.env.BASE_URL}apps-script/paste.html`;
// "Later" is remembered for that version on this device: the banner comes back only when a newer version is published.
const DISMISS = "academy.update.later";
const laterFor = () => { try { return localStorage.getItem(DISMISS); } catch { return null; } };

export function UpdateBanner({ me, apiUrl, onUpdated }: { me: Me; apiUrl: string; onUpdated: () => void }) {
  const [latest, setLatest] = useState<Latest | null>(null);
  const [later, setLater] = useState(laterFor);
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
  // Try-It mode runs the website's own engine: it is always the current version.
  if (isLocalApi(apiUrl)) return null;
  const outdated = !!latest && mine !== "dev" && mine !== latest.version;
  const needsMigration = me.app?.autoUpdates !== true;
  const previous = me.app?.previous ?? null;
  if (me.user.role !== "teacher" || (!needsMigration && !outdated && !result)) return null;
  if (!needsMigration && latest && later === latest.version && !result) return null;

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
      <Alert tone="warning" title="This Sheet can&rsquo;t get updates yet">
        <p>{isOwner ? "This Sheet" : `The Sheet owned by ${owner}`} runs an early copy of the app that can&rsquo;t update itself. A one-time paste (about 2 minutes) fixes that. After it, updates install when you click Update now, and you can undo them.</p>
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
        <Button variant="secondary" size="sm" disabled={busy} onClick={remindLater}>Later</Button>
        {previous && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void undo()}>Undo last update ({previous})</Button>}
      </div>
    </Alert>,
  );

  function wrap(node: ReactNode) {
    return <div className="mb-4">{node}</div>;
  }
  function remindLater() {
    const v = latest?.version ?? "";
    try { localStorage.setItem(DISMISS, v); } catch { /* storage blocked: hidden for this visit only */ }
    setLater(v);
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
