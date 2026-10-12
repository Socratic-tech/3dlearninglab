import { useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, Printer } from "lucide-react";
import qrcode from "qrcode-generator";
import { Alert, Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { classLink } from "../config";
import type { ClassInfo, Me } from "../content";
import { runSetupChecks, type Check } from "../setup-check";

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
/** First-run checklist on the teacher dashboard. Steps tick themselves off; hidden once done or dismissed. */
export function SetupChecklist({ cls, students, apiUrl, goTab }: { cls: ClassInfo; students: Student[]; apiUrl: string; goTab: (tab: "Classes" | "Roster") => void }) {
  const [hidden, setHidden] = useState(() => hasFlag(cls.id, "hide"));
  const [showCheck, setShowCheck] = useState(false);
  const [tick, setTick] = useState(0); // re-read the per-browser flags after a step finishes here
  const realStudents = students.filter((s) => !s.email.includes("+student@"));
  const steps = useMemo(() => [
    { id: "tinkercad", label: "Add your Tinkercad class link", why: "Students open Tinkercad from the lessons with one click.", done: !!cls.tinkercadUrl, action: () => goTab("Classes"), cta: "Add it" },
    { id: "students", label: "Add your students", why: "Import from Google Classroom, paste a list, or share the class link.", done: realStudents.length > 0, action: () => goTab("Roster"), cta: "Add students" },
    { id: "preview", label: "Try it as a student", why: "Student view makes you a test student with XP, avatar and locks.", done: hasFlag(cls.id, "preview") || students.some((s) => s.email.includes("+student@")), href: undefined as string | undefined, action: undefined as (() => void) | undefined, cta: "Use Student view (top right)" },
    { id: "kit", label: "Start your print kit", why: "Print Detective needs samples printed 1–2 weeks ahead.", done: hasFlag(cls.id, "kit"), href: "#/kit", cta: "Open print kit" },
    { id: "poster", label: "Print the class poster and handout", why: "A QR code and join steps for the first day.", done: hasFlag(cls.id, "poster"), href: "#/poster", cta: "Open poster" },
    { id: "check", label: "Run Check my setup", why: "Catches the setup problems that stop students from joining.", done: hasFlag(cls.id, "check"), action: () => setShowCheck(true), cta: "Check now" },
  ], [cls, students, realStudents.length, goTab, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = steps.filter((s) => s.done).length;
  if (hidden || done === steps.length) return null;
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>Get your class ready</CardTitle>
        <span className="text-sm text-muted">{done} of {steps.length} done</span>
        <button className="ml-auto text-sm text-muted underline" onClick={() => { markSetupStep(cls.id, "hide"); setHidden(true); }}>Hide checklist</button>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-2"><div className="h-2 rounded-full bg-primary" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
            {s.done ? <CircleCheck className="size-5 text-success" aria-label="Done" /> : <span className="grid size-5 place-items-center rounded-full border border-border font-mono text-xs">{i + 1}</span>}
            <span className="min-w-0 flex-1"><span className={s.done ? "font-semibold text-muted line-through" : "font-semibold"}>{s.label}</span> <span className="text-muted">· {s.why}</span></span>
            {!s.done && (s.href ? <a href={s.href} className="rounded-lg border border-border px-3 py-1 font-semibold hover:bg-surface-2">{s.cta}</a> : s.action ? <Button size="sm" variant="secondary" onClick={s.action}>{s.cta}</Button> : <span className="text-xs text-muted">{s.cta}</span>)}
          </li>
        ))}
      </ol>
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
