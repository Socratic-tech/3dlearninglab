import { useCallback, useEffect, useState } from "react";
import { Copy } from "lucide-react";
import type { Proficiency } from "@/content/schema";
import { Alert, Card, CardTitle, EmptyState, Pill, Stat } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FriendlyError } from "@/components/ui/friendly-error";
import { Field, Select, Textarea, Input } from "@/components/ui/field";
import { LevelCell, LevelChip, LevelLegend } from "@/components/ui/level";
import { groupLevel, LEVEL_LABEL, LEVELS } from "@/lib/mastery";
import { cn } from "@/lib/cn";
import { call } from "../api";
import { classLink } from "../config";
import { competencies, competencyTitle, heatmapGroups, lessonById, pathLessons } from "../content";

type Ev = { id: string; email: string; lessonId: string; type: string; url: string | null; fileName: string | null; text: string | null; status: string; rating: number | null; comment: string | null; createdAt: string; competencyIds: string[] };
type ClassData = {
  cls: { name: string; pathId: string };
  students: { email: string; name: string; status: string; lastSeen: string | null }[];
  progress: { email: string; lessonId: string; status: string; updatedAt: string }[];
  levels: Record<string, Record<string, Proficiency>>;
  evidence: Ev[];
  struggles: { email: string; lessonId: string; blockId: string; competencyId: string; attempts: number }[];
};

const TABS = ["Overview", "Heatmap", "Review", "Roster"] as const;

export function TeacherPage({ apiUrl, clientId }: { apiUrl: string; clientId: string }) {
  const [data, setData] = useState<ClassData | null>(null);
  const [err, setErr] = useState<{ error: string; details?: string } | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const load = useCallback(async () => {
    const r = await call<ClassData>(apiUrl, "classData");
    if (r.ok) { setData(r.data); setErr(null); } else setErr(r);
  }, [apiUrl]);
  useEffect(() => { void load(); }, [load]);
  if (err) return <FriendlyError {...err} integration onRetry={() => void load()} />;
  if (!data) return <p role="status" className="py-20 text-center text-muted">Loading class data from Google Sheets…</p>;
  const name = (email: string) => data.students.find((s) => s.email === email)?.name ?? email;
  const queue = data.evidence.filter((e) => e.status === "submitted");
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-bold">{data.cls.name}</h1>
        <Pill tone="primary">{data.cls.pathId}</Pill>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => void load()}>Refresh</Button>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Teacher sections">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined} className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold", tab === t ? "border-primary text-primary" : "border-transparent text-muted")}>
            {t}{t === "Review" && queue.length > 0 ? ` (${queue.length})` : ""}
          </button>
        ))}
      </nav>
      {tab === "Overview" && <Overview data={data} name={name} apiUrl={apiUrl} clientId={clientId} />}
      {tab === "Heatmap" && <Heatmap data={data} apiUrl={apiUrl} onSaved={load} />}
      {tab === "Review" && <Review queue={queue} name={name} apiUrl={apiUrl} onSaved={load} />}
      {tab === "Roster" && <Roster data={data} apiUrl={apiUrl} onSaved={load} />}
    </div>
  );
}

function Overview({ data, name, apiUrl, clientId }: { data: ClassData; name: (e: string) => string; apiUrl: string; clientId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const active = new Set(data.progress.filter((p) => String(p.updatedAt).slice(0, 10) === today).map((p) => p.email));
  const path = pathLessons(data.cls.pathId);
  const revisions = data.evidence.filter((e) => e.status === "needs_revision");
  const link = classLink(apiUrl, clientId);
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Students" value={data.students.filter((s) => s.status !== "archived").length} />
        <Stat label="Active today" value={active.size} />
        <Stat label="To review" value={data.evidence.filter((e) => e.status === "submitted").length} />
        <Stat label="Missions completed" value={data.progress.filter((p) => p.status === "completed").length} />
      </div>
      <Card>
        <CardTitle>Class link for students</CardTitle>
        <p className="mt-1 text-sm text-muted">Post this in Google Classroom. It opens the site connected to this class&apos;s Google Sheet.</p>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={link} aria-label="Class link" className="font-mono text-xs" />
          <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(link); setCopied(true); }}><Copy className="size-4" aria-hidden /> {copied ? "Copied" : "Copy"}</Button>
        </div>
      </Card>
      <Card>
        <CardTitle>Students who may need help</CardTitle>
        <ul className="mt-3 space-y-1 text-sm">
          {data.struggles.map((s, i) => <li key={i}><strong>{name(s.email)}</strong> — {s.attempts} attempts on {competencyTitle[s.competencyId] ?? lessonById.get(s.lessonId)?.title} skill check</li>)}
          {revisions.map((e) => <li key={e.id}><strong>{name(e.email)}</strong> — {lessonById.get(e.lessonId)?.title}: revision requested</li>)}
          {!data.struggles.length && !revisions.length && <li className="text-muted">No one flagged right now.</li>}
        </ul>
      </Card>
      <Card>
        <CardTitle>Mission completion</CardTitle>
        <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto text-sm">
          {path.map(({ lesson, week }) => {
            const n = data.progress.filter((p) => p.lessonId === lesson.id && p.status === "completed").length;
            return <li key={lesson.id} className="flex gap-2"><span className="w-8 font-mono text-xs text-muted">W{week}</span><span className="flex-1">{lesson.title}</span><span className="font-mono text-xs">{n}/{data.students.length}</span></li>;
          })}
        </ul>
      </Card>
    </div>
  );
}

function Heatmap({ data, apiUrl, onSaved }: { data: ClassData; apiUrl: string; onSaved: () => void }) {
  const [sel, setSel] = useState<{ email: string; comps: string[] } | null>(null);
  const lv = (email: string, c: string) => data.levels[email]?.[c] ?? "not_attempted";
  return (
    <div className="space-y-4">
      <LevelLegend />
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full border-separate border-spacing-1 p-2 text-sm">
          <caption className="sr-only">Class skill heatmap</caption>
          <thead><tr><th scope="col" className="sticky left-0 bg-surface px-2 text-left">Student</th>{heatmapGroups.map((g) => <th key={g.id} scope="col" className="h-24 min-w-11 align-bottom"><span className="inline-block -rotate-45 whitespace-nowrap text-xs">{g.label}</span></th>)}</tr></thead>
          <tbody>
            {data.students.filter((s) => s.status !== "archived").map((s) => (
              <tr key={s.email}>
                <th scope="row" className="sticky left-0 whitespace-nowrap bg-surface px-2 text-left">{s.name}</th>
                {heatmapGroups.map((g) => {
                  const level = groupLevel(g.competencyIds.map((c) => lv(s.email, c)));
                  return <td key={g.id}><button className="block w-full rounded-md" aria-label={`${s.name}, ${g.label}: ${LEVEL_LABEL[level]}`} onClick={() => setSel({ email: s.email, comps: g.competencyIds })}><LevelCell level={level} /></button></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel && (
        <Card>
          <CardTitle>{data.students.find((s) => s.email === sel.email)?.name}</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">{sel.comps.map((c) => <li key={c} className="flex items-center gap-2"><span className="w-8 font-mono text-xs text-muted">{c}</span><span className="flex-1">{competencyTitle[c]}</span><LevelChip level={lv(sel.email, c)} /></li>)}</ul>
          <OverrideForm email={sel.email} comps={sel.comps} apiUrl={apiUrl} onSaved={onSaved} />
          <h4 className="mt-4 font-semibold">Evidence</h4>
          <ul className="mt-1 space-y-1 text-sm">{data.evidence.filter((e) => e.email === sel.email && e.competencyIds.some((c) => sel.comps.includes(c))).map((e) => <li key={e.id}>{lessonById.get(e.lessonId)?.title}: {e.type} {e.rating ? `· rated ${"I".repeat(e.rating)}` : ""} {e.url && <a className="text-primary underline" href={e.url} target="_blank" rel="noreferrer">open</a>}</li>)}</ul>
        </Card>
      )}
    </div>
  );
}

function OverrideForm({ email, comps, apiUrl, onSaved }: { email: string; comps: string[]; apiUrl: string; onSaved: () => void }) {
  const [c, setC] = useState(comps[0]);
  const [level, setLevel] = useState<Proficiency>("proficient");
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await call(apiUrl, "override", { email, competencyId: c, level, comment });
      setBusy(false); setMsg(r.ok ? "Saved" : r.error); if (r.ok) onSaved();
    }}>
      <Field label="Competency" htmlFor="ov-c"><Select id="ov-c" value={c} onChange={(e) => setC(e.target.value)}>{competencies.filter((x) => comps.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.id} {x.title}</option>)}</Select></Field>
      <Field label="Level" htmlFor="ov-l"><Select id="ov-l" value={level} onChange={(e) => setLevel(e.target.value as Proficiency)}>{LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}</Select></Field>
      <Field label="Comment" htmlFor="ov-m"><Input id="ov-m" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      <Button disabled={busy}>Change proficiency</Button>
      {msg && <p role="status" className="text-sm sm:col-span-4">{msg}</p>}
    </form>
  );
}

function Review({ queue, name, apiUrl, onSaved }: { queue: Ev[]; name: (e: string) => string; apiUrl: string; onSaved: () => void }) {
  if (!queue.length) return <EmptyState title="Nothing waiting for review" />;
  return <ul className="space-y-4">{queue.map((e) => <li key={e.id}><ReviewCard e={e} name={name(e.email)} apiUrl={apiUrl} onSaved={onSaved} /></li>)}</ul>;
}

function ReviewCard({ e, name, apiUrl, onSaved }: { e: Ev; name: string; apiUrl: string; onSaved: () => void }) {
  const [rating, setRating] = useState<number | "">("");
  const [comment, setComment] = useState("");
  const [revise, setRevise] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Card>
      <p className="text-sm"><strong>{name}</strong> · {lessonById.get(e.lessonId)?.title} · <span className="text-muted">{new Date(e.createdAt).toLocaleString()}</span></p>
      <div className="mt-2 rounded-lg bg-surface-2 p-3 text-sm">
        <Pill tone="primary">{e.type.replace("_", " ")}</Pill>{" "}
        {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="break-all text-primary underline">{e.fileName ?? e.url}</a>}
        {e.text && <p className="mt-2 whitespace-pre-wrap">{e.text}</p>}
      </div>
      <p className="mt-1 text-xs text-muted">Evidence for: {e.competencyIds.map((c) => `${c} ${competencyTitle[c] ?? ""}`).join(" · ")}</p>
      <fieldset className="mt-3 flex flex-wrap gap-2 text-sm">
        <legend className="mb-1 font-semibold">Rating</legend>
        {[["", "No rating"], [1, "I · Developing"], [2, "II · Proficient"], [3, "III · Independent"]].map(([v, l]) => (
          <label key={String(v)} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1"><input type="radio" name={`r-${e.id}`} checked={rating === v} onChange={() => setRating(v as number | "")} /> {l}</label>
        ))}
      </fieldset>
      <Field label="Feedback for the student" htmlFor={`c-${e.id}`} className="mt-2"><Textarea id={`c-${e.id}`} value={comment} onChange={(x) => setComment(x.target.value)} className="min-h-16" /></Field>
      <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={revise} onChange={(x) => setRevise(x.target.checked)} /> Ask for a revision</label>
      <Button className="mt-3" size="sm" disabled={busy} onClick={async () => {
        setBusy(true);
        const r = await call(apiUrl, "review", { evidenceId: e.id, rating: rating || null, comment, needsRevision: revise });
        setBusy(false);
        if (r.ok) onSaved(); else setErr(r.error);
      }}>{busy ? "Saving…" : "Save review"}</Button>
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
    </Card>
  );
}

function Roster({ data, apiUrl, onSaved }: { data: ClassData; apiUrl: string; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [courses, setCourses] = useState<{ id: string; name: string; section: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle>Students ({data.students.length})</CardTitle>
        <ul className="mt-3 max-h-96 divide-y divide-border overflow-y-auto text-sm">
          {data.students.map((s) => <li key={s.email} className="flex gap-2 py-1.5"><span className="font-semibold">{s.name}</span><span className="truncate text-muted">{s.email}</span>{s.lastSeen && <span className="ml-auto text-xs text-muted">seen {String(s.lastSeen).slice(0, 10)}</span>}</li>)}
        </ul>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardTitle>Import from Google Classroom</CardTitle>
          {!courses ? (
            <Button className="mt-3" variant="secondary" disabled={busy} onClick={async () => {
              setBusy(true); const r = await call<typeof courses>(apiUrl, "classroomCourses"); setBusy(false);
              if (r.ok) setCourses(r.data ?? []); else setMsg(r.error);
            }}>{busy ? "Loading…" : "Show my Classroom classes"}</Button>
          ) : (
            <ul className="mt-3 space-y-2">
              {courses.map((c) => <li key={c.id} className="flex items-center gap-2"><span className="flex-1">{c.name}{c.section && ` · ${c.section}`}</span><Button size="sm" disabled={busy} onClick={async () => {
                setBusy(true); const r = await call<{ added: number }>(apiUrl, "importClassroom", { courseId: c.id }); setBusy(false);
                setMsg(r.ok ? `Imported — ${r.data.added} new student(s).` : r.error); if (r.ok) onSaved();
              }}>Import roster</Button></li>)}
              {courses.length === 0 && <li className="text-sm text-muted">No active classes.</li>}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>Add students by hand</CardTitle>
          <Field label="One per line: Name, email" htmlFor="add" className="mt-3"><Textarea id="add" value={text} onChange={(e) => setText(e.target.value)} placeholder={"Maya Okafor, maya@students.district.org"} /></Field>
          <Button className="mt-3" disabled={busy || !text.trim()} onClick={async () => {
            const students = text.split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((p) => p.length >= 2).map(([n, e]) => ({ name: n, email: e }));
            setBusy(true); const r = await call<{ added: number }>(apiUrl, "addStudents", { students }); setBusy(false);
            setMsg(r.ok ? `Added ${r.data.added} student(s).` : r.error); if (r.ok) { setText(""); onSaved(); }
          }}>Add students</Button>
        </Card>
        {msg && <Alert tone="info">{msg}</Alert>}
      </div>
    </div>
  );
}
