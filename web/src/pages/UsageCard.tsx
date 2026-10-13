import { useEffect, useState } from "react";
import { Alert, Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentToken, tokenEmail } from "../auth";

const USAGE_URL = (import.meta.env.VITE_USAGE_URL as string | undefined) ?? "";
const USAGE_OWNER = ((import.meta.env.VITE_USAGE_OWNER as string | undefined) ?? "").toLowerCase();

type Copy = { copyId: string; firstSeen: string; lastSeen: string; version: string; classes: number; students: number; activeWeek: number; missionsWeek: number; missionsTotal: number; courses: Record<string, number> };
type Usage = { copies: Copy[]; trend: { week: string; copies: number; active: number; missions: number }[]; at: string };

const COURSE_NAMES: Record<string, string> = { "18-week": "18-week", "9-week": "9-week", "jr-starter": "Grades 4–5", custom: "Custom path" };
const days = (iso: string) => (Date.now() - Date.parse(iso)) / 86400000;
const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

/** Program owner only: counts every teacher copy reports once a day (numbers only). */
export function UsageCard() {
  const me = (tokenEmail() ?? "").toLowerCase();
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(USAGE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "summary", token: currentToken() }) });
      const j = (await res.json()) as { ok: boolean; data?: Usage; error?: string };
      if (j.ok && j.data) setData(j.data); else setError(j.error ?? "The usage Sheet didn't answer.");
    } catch (e) {
      setError(`Couldn't reach the usage Sheet (${String(e).slice(0, 80)}).`);
    }
    setBusy(false);
  };
  useEffect(() => { if (USAGE_URL && me === USAGE_OWNER) void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!USAGE_OWNER || me !== USAGE_OWNER) return null;
  if (!USAGE_URL) {
    return (
      <Card>
        <CardTitle>Usage across schools</CardTitle>
        <p className="mt-1 text-sm text-muted">Not set up yet. Deploy <code>apps-script/usage/Receiver.gs</code> from a Sheet in your Drive and put its address in <code>apps-script/build.config.json</code> → <code>usageUrl</code>.</p>
      </Card>
    );
  }
  const copies = data?.copies ?? [];
  const live = copies.filter((c) => days(c.lastSeen) <= 30);
  const sum = (k: keyof Copy, xs = live) => xs.reduce((n, c) => n + (Number(c[k]) || 0), 0);
  const courses: Record<string, number> = {};
  live.forEach((c) => Object.entries(c.courses).forEach(([k, n]) => { courses[k] = (courses[k] ?? 0) + n; }));
  const tiles: [string, number | string][] = [
    ["Copies in use (30 days)", live.length],
    ["Active this week (7 days)", copies.filter((c) => days(c.lastSeen) <= 7).length],
    ["Classes", sum("classes")],
    ["Students", sum("students")],
    ["Students active this week", sum("activeWeek")],
    ["Missions done this week", sum("missionsWeek")],
    ["Missions done, all time", sum("missionsTotal", copies)],
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>Usage across schools</CardTitle>
        <span className="text-xs text-muted">Only you see this · numbers only, reported once a day by each copy</span>
        <Button size="sm" variant="ghost" className="ml-auto" disabled={busy} onClick={() => void load()}>{busy ? "Loading…" : "Refresh"}</Button>
      </div>
      {error && <div className="mt-3"><Alert tone="danger">{error}</Alert></div>}
      {data && (
        <div className="mt-3 space-y-4 text-sm">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tiles.map(([k, v]) => <li key={k} className="rounded-xl border border-border bg-surface p-3"><span className="block font-display text-2xl font-bold">{v}</span><span className="text-muted">{k}</span></li>)}
          </ul>
          {Object.keys(courses).length > 0 && <p><strong>Classes by course:</strong> {Object.entries(courses).map(([k, n]) => `${COURSE_NAMES[k] ?? k} ${n}`).join(" · ")}</p>}
          {data.trend.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="text-left font-semibold">By week</caption>
                <thead className="text-muted"><tr><th className="py-1 pr-3 font-normal">Week of</th><th className="pr-3 font-normal">Copies</th><th className="pr-3 font-normal">Students active</th><th className="font-normal">Missions done</th></tr></thead>
                <tbody>{data.trend.map((w) => <tr key={w.week} className="border-t border-border"><td className="py-1 pr-3">{day(w.week + "T12:00:00Z")}</td><td className="pr-3">{w.copies}</td><td className="pr-3">{w.active}</td><td>{w.missions}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <details>
            <summary className="cursor-pointer font-semibold">Each copy ({copies.length})</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted"><tr>{["Copy", "First seen", "Last report", "Version", "Classes", "Students", "Active wk", "Missions wk", "All time"].map((h) => <th key={h} className="py-1 pr-3 font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {[...copies].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).map((c) => (
                    <tr key={c.copyId} className="border-t border-border"><td className="py-1 pr-3 font-mono">{c.copyId}</td><td className="pr-3">{day(c.firstSeen)}</td><td className="pr-3">{day(c.lastSeen)}</td><td className="pr-3 font-mono">{c.version}</td><td className="pr-3">{c.classes}</td><td className="pr-3">{c.students}</td><td className="pr-3">{c.activeWeek}</td><td className="pr-3">{c.missionsWeek}</td><td>{c.missionsTotal}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="text-xs text-muted">A copy reports when its teacher opens the dashboard (at most once a day), so a copy whose teacher hasn’t opened it lately shows its last numbers. Districts can turn reports off with USAGE_REPORTS = FALSE in Config.</p>
        </div>
      )}
    </Card>
  );
}
