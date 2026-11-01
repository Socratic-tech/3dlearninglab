import { useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, Eye, Link2, Printer, QrCode, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import qrcode from "qrcode-generator";
import { Alert, Card, CardTitle } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { call, callOnce } from "../api";
import { classLink } from "../config";
import type { ClassInfo, Me } from "../content";
import { runSetupChecks, type Check } from "../setup-check";
import { setStudentView } from "../state";

// Small per-browser flags for checklist steps the server can't see (each teacher's own computer).
const flagKey = (classId: string, step: string) => `academy.setup.${classId}.${step}`;
export function markSetupStep(classId: string | undefined, step: string) {
  if (!classId) return;
  try { localStorage.setItem(flagKey(classId, step), "1"); } catch { /* ignore */ }
}
const hasFlag = (classId: string, step: string) => { try { return localStorage.getItem(flagKey(classId, step)) === "1"; } catch { return false; } };

/** "Check my setup": runs plain-language checks and shows each with a fix. Works even when the dashboard can't load. */
export function SetupCheckPanel({ apiUrl, classId, autoRun, onAllOk }: { apiUrl: string | null; classId?: string; autoRun?: boolean; onAllOk?: () => void }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const r = await runSetupChecks(apiUrl);
    setChecks(r);
    setBusy(false);
    if (r.every((c) => c.status === "ok")) { markSetupStep(classId, "check"); onAllOk?.(); }
  };
  useEffect(() => { if (autoRun) void run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const problems = checks?.filter((c) => c.status !== "ok").length ?? 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" disabled={busy} onClick={() => void run()}>{busy ? "Checking…" : checks ? "Check again" : "Check my setup"}</Button>
        {checks && <span role="status" className="text-sm font-semibold">{problems === 0 ? "Everything looks right." : `${problems} thing${problems === 1 ? "" : "s"} to fix`}</span>}
      </div>
      {checks && (
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-sm">
              {c.status === "ok" ? <CircleCheck className="size-5 shrink-0 text-success" aria-label="OK" /> : c.status === "warn" ? <CircleAlert className="size-5 shrink-0 text-warning" aria-label="Worth fixing" /> : <CircleX className="size-5 shrink-0 text-danger" aria-label="Needs fixing" />}
              <div className="min-w-0">
                <p className="font-semibold">{c.label}</p>
                <p className="text-muted">{c.detail}</p>
                {c.fix && <p className="mt-1"><strong>Fix:</strong> {c.fix}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Student = { email: string };
type Step = { id: string; icon: LucideIcon; label: string; why: string; done: boolean; cta: string; href?: string; action?: () => void };

/**
 * First-run checklist on the teacher dashboard, as check cards: the next three steps left (the next one highlighted;
 * the rest one click away), finished steps as small "Done" chips. Steps tick themselves off; hidden once done or
 * dismissed.
 */
export function SetupChecklist({ cls, students, apiUrl, goTab }: { cls: ClassInfo; students: Student[]; apiUrl: string; goTab: (tab: "Classes" | "Roster") => void }) {
  const [hidden, setHidden] = useState(() => hasFlag(cls.id, "hide"));
  const [showCheck, setShowCheck] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tick, setTick] = useState(0); // re-read the per-browser flags after a step finishes here
  const realStudents = students.filter((s) => !s.email.includes("+student@"));
  const steps = useMemo<Step[]>(() => [
    { id: "tinkercad", icon: Link2, label: "Add your Tinkercad class link", why: "Students open Tinkercad from the lessons in one click.", done: !!cls.tinkercadUrl, action: () => goTab("Classes"), cta: "Add link" },
    { id: "students", icon: Users, label: "Add your students", why: "Import from Google Classroom, paste a list, or share the class link.", done: realStudents.length > 0, action: () => goTab("Roster"), cta: "Add students" },
    { id: "preview", icon: Eye, label: "Try it as a student", why: "See the missions exactly as students do, with a test student.", done: hasFlag(cls.id, "preview") || students.some((s) => s.email.includes("+student@")), action: () => { markSetupStep(cls.id, "preview"); setStudentView(true); location.hash = "#/student"; }, cta: "Open student view" },
    { id: "kit", icon: Printer, label: "Start your print kit", why: "Print Detective needs samples printed 1–2 weeks ahead.", done: hasFlag(cls.id, "kit"), href: "#/kit", cta: "Open print kit" },
    { id: "poster", icon: QrCode, label: "Print the class poster", why: "A QR code and join steps for the first day.", done: hasFlag(cls.id, "poster"), href: "#/poster", cta: "Open poster" },
    { id: "check", icon: ShieldCheck, label: "Check my setup", why: "Finds problems that would stop students from joining.", done: hasFlag(cls.id, "check"), action: () => setShowCheck(true), cta: "Check now" },
  ], [cls, students, realStudents.length, goTab, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = steps.filter((s) => !s.done);
  const finished = steps.filter((s) => s.done);
  const shown = showAll ? left : left.slice(0, 3); // one row on wide screens; the rest one click away
  if (hidden || left.length === 0) return null;
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <CardTitle>Get your class ready</CardTitle>
        <span className="text-sm text-muted" role="status">{finished.length} of {steps.length} done</span>
        <button className="ml-auto text-sm text-muted underline hover:text-fg" onClick={() => { markSetupStep(cls.id, "hide"); setHidden(true); }}>Hide checklist</button>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-surface-2" aria-hidden><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(finished.length / steps.length) * 100}%` }} /></div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((s, i) => {
          const Icon = s.icon;
          const next = i === 0;
          return (
            <li key={s.id} className={`flex flex-col rounded-xl border bg-surface p-3 ${next ? "border-primary" : "border-border"}`}>
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 size-5 shrink-0 ${next ? "text-primary" : "text-muted"}`} aria-hidden />
                <p className="min-w-0 flex-1 font-semibold leading-snug">{s.label}</p>
                {next && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg">Next</span>}
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{s.why}</p>
              <div className="mt-3">
                {s.href
                  ? <a href={s.href} className={buttonClass(next ? "primary" : "secondary", "sm")}>{s.cta}</a>
                  : <Button size="sm" variant={next ? "primary" : "secondary"} onClick={s.action}>{s.cta}</Button>}
              </div>
            </li>
          );
        })}
      </ul>
      {left.length > 3 && (
        <button className="mt-2 text-sm font-semibold text-primary underline" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer steps" : `Show ${left.length - 3} more step${left.length - 3 === 1 ? "" : "s"}`}
        </button>
      )}
      {finished.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Done:</span>
          {finished.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5"><CircleCheck className="size-3.5 text-success" aria-hidden />{s.label}</span>
          ))}
        </p>
      )}
      {showCheck && <div className="mt-4"><SetupCheckPanel apiUrl={apiUrl} classId={cls.id} autoRun onAllOk={() => setTick((n) => n + 1)} /></div>}
    </Card>
  );
}

function Qr({ text, size = 280 }: { text: string; size?: number }) {
  const svg = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c},${r}h1v1h-1z`;
    return { n, d };
  }, [text]);
  return (
    <svg role="img" aria-label="QR code for the class link" width={size} height={size} viewBox={`-2 -2 ${svg.n + 4} ${svg.n + 4}`} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={svg.n + 4} height={svg.n + 4} fill="#fff" />
      <path d={svg.d} fill="#000" />
    </svg>
  );
}

/** Printable first-day materials: a class poster with QR code, and cut-apart student join cards. */
export function PosterPage({ me, apiUrl, clientId }: { me: Me; apiUrl: string; clientId: string }) {
  const cls = me.cls;
  useEffect(() => { markSetupStep(cls?.id, "poster"); }, [cls?.id]);
  if (!cls) return <Alert tone="warning" title="Create a class first." />;
  const link = classLink(apiUrl, clientId, cls.id);
  const title = `${cls.name}${cls.section ? ` · ${cls.section}` : ""}`;
  const card = (
    <div className="break-inside-avoid rounded-2xl border-2 border-dashed border-border p-5">
      <p className="font-display text-xl font-bold">Join {title}</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        <li>Open the class link your teacher shared (Google Classroom), or scan the QR code on the poster.</li>
        <li>Sign in with your <strong>school</strong> Google account.</li>
        <li>Go to <strong>tinkercad.com/joinclass</strong> and type the class code: <span className="inline-block w-32 border-b border-current">&nbsp;</span></li>
        <li>Your Tinkercad nickname: <span className="inline-block w-40 border-b border-current">&nbsp;</span></li>
      </ol>
      <p className="mt-3 text-sm">Stuck? Raise your hand. Your work saves on its own.</p>
    </div>
  );
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <a href="#/teacher" className="text-sm text-muted hover:text-fg">← Teacher dashboard</a>
        <Button size="sm" className="ml-auto" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print</Button>
      </div>
      <p className="mb-4 text-sm text-muted print:hidden">Page 1 is the poster for your board. Page 2 has four student cards to cut apart. Fill in your Tinkercad class code before printing copies.</p>
      <section className="flex min-h-[9in] flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-white p-10 text-center text-black print:min-h-0 print:border-0 print:p-0" style={{ breakAfter: "page" }}>
        <p className="font-mono text-sm uppercase tracking-[0.3em]">3D Design Academy</p>
        <h1 className="font-display text-5xl font-bold">{title}</h1>
        <p className="text-2xl">Scan to join your missions</p>
        <Qr text={link} size={320} />
        <p className="max-w-md text-lg">Sign in with your <strong>school</strong> Google account. Your work saves on its own.</p>
      </section>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 print:mt-0 print:grid-cols-2">
        {card}{card}{card}{card}
      </section>
    </div>
  );
}

// ───────────────────────── Classroom stress test ─────────────────────────

type LoadInfo = { tabs: Record<string, number>; cells: number; cellLimit: number; testStudents: number };
type Read = { tab: string; rows: number; ms: number; from: string };
type One = { ok: boolean; ms: number; tries: number; error: string | null; server: number | null; reads: Read[] };
type StressResult = { at: string; label: string; kind: string; count: number; wall: number; runs: One[] };

const pct = (xs: number[], p: number) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
const sec = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** Plain-language summary of a stress-test run, also used for "Copy results". */
function summarize(r: StressResult, info: LoadInfo | null) {
  const ok = r.runs.filter((x) => x.ok);
  const failed = r.runs.filter((x) => !x.ok);
  const times = ok.map((x) => x.ms);
  const server = ok.map((x) => x.server ?? 0).filter(Boolean);
  const tabs = new Map<string, { ms: number; n: number; rows: number; cached: number }>();
  const whys = new Map<string, number>();
  r.runs.forEach((x) => x.reads.forEach((rd) => { if (rd.from === "why") whys.set(rd.tab, (whys.get(rd.tab) ?? 0) + 1); }));
  ok.forEach((x) => x.reads.filter((rd) => rd.from !== "why").forEach((rd) => {
    const t = tabs.get(rd.tab) ?? { ms: 0, n: 0, rows: 0, cached: 0 };
    t.ms += rd.ms; t.n++; t.rows = Math.max(t.rows, rd.rows); if (rd.from === "cache" || rd.from === "copy" || rd.from === "waited") t.cached++;
    tabs.set(rd.tab, t);
  }));
  const parts = [...tabs.entries()].map(([tab, t]) => ({ tab, avg: t.ms / t.n, rows: t.rows, cached: Math.round((100 * t.cached) / t.n) })).sort((a, b) => b.avg - a.avg);
  const errors = [...new Set(failed.map((x) => x.error ?? "unknown"))];
  const p90 = pct(times, 90);
  const verdict = failed.length
    ? { tone: "danger" as const, text: `${failed.length} of ${r.count} students would have seen an error, even after retrying.` }
    : p90 <= 6000 ? { tone: "success" as const, text: `Good: 9 in 10 students were done within ${sec(p90)}.` }
    : p90 <= 12000 ? { tone: "warning" as const, text: `Works, but slow: 9 in 10 students waited up to ${sec(p90)}.` }
    : { tone: "danger" as const, text: `Too slow: 9 in 10 students waited up to ${sec(p90)}.` };
  const lines = [
    `3D Design Academy stress test · ${r.label} · ${r.at}`,
    `${r.count} students at once · ${r.kind === "save" ? "saving an answer" : "opening their home page"}`,
    `Finished: ${ok.length}/${r.count} · needed a retry: ${r.runs.filter((x) => x.tries > 1).length} · failed: ${failed.length}`,
    `Wait per student: median ${sec(pct(times, 50))}, 90% within ${sec(p90)}, slowest ${sec(Math.max(0, ...times))} · whole wave ${sec(r.wall)}`,
    server.length ? `Time inside Google's script: median ${sec(pct(server, 50))}, slowest ${sec(Math.max(...server))}` : "",
    `Slowest parts (average per student): ${parts.slice(0, 8).map((p) => `${p.tab} ${Math.round(p.avg)} ms${p.rows ? ` (${p.rows} rows${p.cached ? `, ${p.cached}% saved copy` : ""})` : ""}`).join("; ")}`,
    info ? `Sheet size: ${Object.entries(info.tabs).map(([k, v]) => `${k} ${v}`).join(", ")} · cells ${(info.cells / 1e6).toFixed(2)}M of 10M` : "",
    whys.size ? `Why the Sheet was read: ${[...whys.entries()].map(([k, n]) => `${k} ×${n}`).join("; ")}` : "",
    errors.length ? `Errors: ${errors.join(" | ")}` : "",
  ].filter(Boolean);
  return { ok, failed, times, server, parts, verdict, text: lines.join("\n") };
}

/**
 * Teacher tool: adds test students with a full semester of work, then has many of them open the app (or save) at the
 * same moment, like a class at the bell, and reports how long each waited and which Sheet tabs cost the most.
 */
export function StressTestPanel({ apiUrl }: { apiUrl: string }) {
  const [info, setInfo] = useState<LoadInfo | null>(null);
  const [target, setTarget] = useState(150);
  const [count, setCount] = useState(30);
  const [kind, setKind] = useState<"open" | "save">("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StressResult[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    const r = await call<LoadInfo>(apiUrl, "loadInfo");
    if (r.ok) setInfo(r.data); else setError(r.error);
  };
  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const seed = async () => {
    setError(null);
    const have = info?.testStudents ?? 0;
    for (let from = have + 1; from <= target; from += 25) {
      setBusy(`Adding test students with a semester of work… ${from - 1} of ${target}`);
      const r = await call<{ added: number }>(apiUrl, "loadSeed", { from, count: Math.min(25, target - from + 1) });
      if (!r.ok) { setError(r.error); break; }
    }
    setBusy(null);
    await refresh();
  };

  const run = async () => {
    if (!info?.testStudents) return;
    setError(null); setResults([]); setCopied(false);
    const n = Math.min(count, info.testStudents);
    const action = kind === "save" ? "saveDraft" : "me";
    const extra = kind === "save" ? { lessonId: "layers", blockId: "reflect", text: "Stress test draft: my design changed after testing." } : {};
    const one = async (i: number): Promise<One> => {
      const id = crypto.randomUUID();
      const start = performance.now();
      let tries = 0;
      let r: { ok: boolean; error?: string; details?: string; retryable?: boolean; timing?: { ms: number; reads: Read[] } };
      for (;;) {
        tries++;
        r = (await callOnce(apiUrl, action, { ...extra, asLoad: i + 1, bench: true }, id)) as typeof r;
        if (r.ok || !r.retryable || tries >= 3) break;
        await new Promise((res) => setTimeout(res, 1500 * tries + Math.random() * 1500)); // same waits the app uses
      }
      return { ok: r.ok, ms: performance.now() - start, tries, error: r.ok ? null : `${r.error ?? "unknown"}${r.details ? ` (${String(r.details).slice(0, 160)})` : ""}`, server: r.timing?.ms ?? null, reads: r.timing?.reads ?? [] };
    };
    // Wave 1 starts from nothing saved (first period, before the teacher opens the dashboard); wave 2 is the same
    // class a moment later, when the students' saved copies are ready.
    const out: StressResult[] = [];
    await call(apiUrl, "flushCache");
    for (const label of ["Wave 1: start of the day", "Wave 2: class warmed up"]) {
      setBusy(`${label} — ${n} test students ${kind === "save" ? "saving" : "opening the app"} at the same moment…`);
      const t0 = performance.now();
      const runs = await Promise.all(Array.from({ length: n }, (_, i) => one(i)));
      out.push({ at: new Date().toLocaleString(), label, kind, count: n, wall: performance.now() - t0, runs });
      setResults([...out]);
    }
    setBusy(null);
  };

  const clear = async () => {
    setConfirmClear(false); setError(null);
    setBusy("Removing test students…");
    const r = await call<{ removed: number }>(apiUrl, "loadClear");
    setBusy(null);
    if (!r.ok) setError(r.error);
    setResults([]);
    await refresh();
  };

  const sums = results.map((r) => ({ r, s: summarize(r, info) }));
  const sel = "h-10 rounded-xl border border-border bg-surface px-3";
  return (
    <div className="space-y-3 text-sm">
      <Alert tone="warning" title="Run this after school.">It adds and removes rows in your Sheet while it works. Your students’ real work is never changed.</Alert>
      {info && (
        <p className="text-muted">
          Your Sheet: {info.tabs.Users ?? 0} people · {info.tabs.Progress ?? 0} mission rows · {info.tabs.Attempts ?? 0} answers · {(info.cells / 1e6).toFixed(2)}M of Google’s 10M-cell limit.
          {" "}{info.testStudents ? <strong>{info.testStudents} test students added.</strong> : "No test students yet."}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1"><span className="font-semibold">1. Test students (each with a full semester done)</span>
          <select className={sel} value={target} onChange={(e) => setTarget(Number(e.target.value))}>
            {[30, 90, 150, 250].map((v) => <option key={v} value={v}>{v} students{v === 150 ? " (5 class periods)" : ""}</option>)}
          </select>
        </label>
        <Button variant="secondary" disabled={!!busy || (info?.testStudents ?? 0) >= target} onClick={() => void seed()}>Add test students</Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1"><span className="font-semibold">2. At the same moment</span>
          <select className={sel} value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[10, 30, 45, 60].map((v) => <option key={v} value={v}>{v} students</option>)}
          </select>
        </label>
        <label className="grid gap-1"><span className="font-semibold">doing</span>
          <select className={sel} value={kind} onChange={(e) => setKind(e.target.value as "open" | "save")}>
            <option value="open">open their home page</option>
            <option value="save">save an answer</option>
          </select>
        </label>
        <Button disabled={!!busy || !info?.testStudents} onClick={() => void run()}>Run the test</Button>
      </div>
      {busy && <p role="status" className="font-semibold">{busy}</p>}
      {error && <Alert tone="danger">{error}</Alert>}
      {sums.map(({ r: result, s }) => (
        <div key={result.label} className="space-y-2 rounded-xl border border-border bg-surface p-3">
          <p className="font-semibold">{result.label}</p>
          <Alert tone={s.verdict.tone}>{s.verdict.text}</Alert>
          <ul className="grid gap-1 sm:grid-cols-2">
            <li>Finished: <strong>{s.ok.length} of {result.count}</strong>{s.failed.length ? ` · ${s.failed.length} failed` : ""}</li>
            <li>Needed a retry: <strong>{result.runs.filter((x) => x.tries > 1).length}</strong></li>
            <li>Typical wait: <strong>{sec(pct(s.times, 50))}</strong> · slowest {sec(Math.max(0, ...s.times))}</li>
            <li>Inside Google’s script: {s.server.length ? `${sec(pct(s.server, 50))} typical` : "n/a"}</li>
          </ul>
          {s.parts.length > 0 && (
            <details>
              <summary className="cursor-pointer font-semibold">What took the time</summary>
              <ul className="mt-1 space-y-0.5 font-mono text-xs">
                {s.parts.slice(0, 10).map((p) => <li key={p.tab}>{p.tab}: {Math.round(p.avg)} ms{p.rows ? ` · ${p.rows} rows` : ""}{p.cached ? ` · ${p.cached}% from saved copy` : ""}</li>)}
              </ul>
            </details>
          )}
        </div>
      ))}
      {sums.length > 0 && !busy && <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(sums.map((x) => x.s.text).join("\n\n")).then(() => setCopied(true)); }}>{copied ? "Copied" : "Copy results"}</Button>}
      {(info?.testStudents ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {confirmClear
            ? <><span className="font-semibold">Remove all {info?.testStudents} test students and the stress-test class?</span><Button size="sm" variant="danger" disabled={!!busy} onClick={() => void clear()}>Yes, remove</Button><Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button></>
            : <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => setConfirmClear(true)}>3. Remove test students</Button>}
        </div>
      )}
    </div>
  );
}
