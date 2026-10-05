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
import { classLink, setCurrentClassId, staffLink } from "../config";
import { setStudentView } from "../state";
import type { ClassInfo, Me } from "../content";
import { competencies, competencyTitle, heatmapGroups, lessonById, lessons as allLessons, pathLessons } from "../content";
import { offlineChallenges } from "./HandoutPage";
import { UpdateBanner } from "./UpdateBanner";

type Ev = { id: string; email: string; lessonId: string; type: string; url: string | null; fileName: string | null; text: string | null; status: string; rating: number | null; comment: string | null; createdAt: string; competencyIds: string[] };
type ClassData = {
  cls: ClassInfo;
  classes: ClassInfo[];
  students: { email: string; name: string; status: string; lastSeen: string | null }[];
  progress: { email: string; lessonId: string; status: string; updatedAt: string }[];
  levels: Record<string, Record<string, Proficiency>>;
  evidence: Ev[];
  struggles: { email: string; lessonId: string; blockId: string; attempts: number }[];
  live?: Live;
  prints?: PrintJob[];
  galleryIds?: string[];
};
type Live = {
  stuck: { email: string; lessonId: string; blockId: string; attempts: number; since: string }[];
  quiet: { email: string; lessonId: string; minutes: number }[];
  missed: { lessonId: string; blockId: string; prompt: string; count: number; students: string[] }[];
  activeToday: number;
  at: string;
};
export type PrintJob = { id: string; email: string; lessonId: string; fileName: string | null; fileUrl: string | null; status: string; note: string; teacherNote: string; createdAt: string; updatedAt: string };

const TABS = ["Overview", "Lessons", "Heatmap", "Review", "Prints", "Rewards", "Roster", "Classes"] as const;

export function TeacherPage(p: { me: Me; apiUrl: string; clientId: string; onChange: () => void }) {
  return (
    <>
      <UpdateBanner me={p.me} apiUrl={p.apiUrl} onUpdated={p.onChange} />
      <TeacherMain {...p} />
    </>
  );
}

function TeacherMain({ me, apiUrl, clientId, onChange }: { me: Me; apiUrl: string; clientId: string; onChange: () => void }) {
  if (!me.cls) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <h1 className="font-display text-3xl font-bold">Create your first class</h1>
        <p className="mt-1 text-muted">All your classes live in your one Google Sheet. Add more any time.</p>
        <Card className="mt-6"><NewClassForm apiUrl={apiUrl} onCreated={onChange} /></Card>
      </div>
    );
  }
  return <ClassView key={me.cls.id} classId={me.cls.id} apiUrl={apiUrl} clientId={clientId} onChange={onChange} />;
}

/** Co-teachers and administrators need this link (with the app address), not the bare website. */
function StaffLinkButton({ apiUrl, clientId }: { apiUrl: string; clientId: string }) {
  const [copied, setCopied] = useState(false);
  const link = staffLink(apiUrl, clientId);
  return (
    <Button
      size="sm"
      variant="secondary"
      title="Copy a dashboard link for co-teachers and administrators. Add their email under Who can sign in first."
      onClick={() => {
        navigator.clipboard?.writeText(link).then(() => setCopied(true), () => prompt("Copy this link:", link));
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      <Copy className="size-4" aria-hidden /> {copied ? "Copied!" : "Staff link"}
    </Button>
  );
}

const classKey = (id: string) => `academy.classdata.${id}`;
function ClassView({ classId, apiUrl, clientId, onChange }: { classId: string; apiUrl: string; clientId: string; onChange: () => void }) {
  // open instantly from the last snapshot (this browser tab only), then refresh from Google
  const [data, setData] = useState<ClassData | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(classKey(classId)) ?? "null"); } catch { return null; }
  });
  const [err, setErr] = useState<{ error: string; details?: string } | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const load = useCallback(async () => {
    const r = await call<ClassData>(apiUrl, "classData");
    if (r.ok) {
      setData(r.data);
      setErr(null);
      try { sessionStorage.setItem(classKey(classId), JSON.stringify(r.data)); } catch { /* too big: skip */ }
    } else setErr(r);
  }, [apiUrl, classId]);
  useEffect(() => { void load(); }, [load]);
  // keep "Right now" fresh during class (only while the Overview tab is visible)
  useEffect(() => {
    if (tab !== "Overview") return;
    const t = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => clearInterval(t);
  }, [tab, load]);
  if (err) return <FriendlyError {...err} integration onRetry={() => void load()} />;
  if (!data) return <p role="status" className="py-20 text-center text-muted">Loading class data from Google Sheets…</p>;
  const name = (email: string) => data.students.find((s) => s.email === email)?.name ?? email;
  const queue = data.evidence.filter((e) => e.status === "submitted");
  const openPrints = (data.prints ?? []).filter((p) => ["queued", "redo", "printing"].includes(p.status)).length;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-bold">{data.cls.name}{data.cls.section && <span className="text-muted"> · {data.cls.section}</span>}</h1>
        <Pill tone="primary">{data.cls.pathId}</Pill>
        <Button size="sm" variant="secondary" className="ml-auto" title="See the missions exactly as a student does: locks, required answers and all." onClick={() => { setStudentView(true); location.hash = "#/student"; }}>Student view</Button>
        <StaffLinkButton apiUrl={apiUrl} clientId={clientId} />
        <Button size="sm" variant="secondary" onClick={() => void load()}>Refresh</Button>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Teacher sections">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined} className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold", tab === t ? "border-primary text-primary" : "border-transparent text-muted")}>
            {t}{t === "Review" && queue.length > 0 ? ` (${queue.length})` : ""}{t === "Prints" && openPrints > 0 ? ` (${openPrints})` : ""}
          </button>
        ))}
      </nav>
      {tab === "Overview" && <Overview data={data} name={name} apiUrl={apiUrl} clientId={clientId} />}
      {tab === "Lessons" && <LessonLibrary data={data} />}
      {tab === "Heatmap" && <Heatmap data={data} apiUrl={apiUrl} onSaved={load} />}
      {tab === "Review" && <Review queue={queue} name={name} apiUrl={apiUrl} onSaved={load} galleryIds={data.galleryIds ?? []} />}
      {tab === "Prints" && <Prints jobs={data.prints ?? []} name={name} apiUrl={apiUrl} onSaved={load} />}
      {tab === "Rewards" && <Rewards apiUrl={apiUrl} />}
      {tab === "Roster" && <Roster data={data} apiUrl={apiUrl} onSaved={load} onClassesChanged={onChange} />}
      {tab === "Classes" && <Classes data={data} apiUrl={apiUrl} onChange={() => { onChange(); void load(); }} />}
    </div>
  );
}

function Overview({ data, name, apiUrl, clientId }: { data: ClassData; name: (e: string) => string; apiUrl: string; clientId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const active = new Set(data.progress.filter((p) => String(p.updatedAt).slice(0, 10) === today).map((p) => p.email));
  const path = pathLessons(data.cls.pathId);
  const revisions = data.evidence.filter((e) => e.status === "needs_revision");
  const link = classLink(apiUrl, clientId, data.cls.id);
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Students" value={data.students.filter((s) => s.status !== "archived").length} />
        <Stat label="Active today" value={data.live?.activeToday ?? active.size} />
        <Stat label="To review" value={data.evidence.filter((e) => e.status === "submitted").length} />
        <Stat label="Missions completed" value={data.progress.filter((p) => p.status === "completed").length} />
      </div>
      <Card>
        <CardTitle>Class link for students</CardTitle>
        <p className="mt-1 text-sm text-muted">Post this in this class&apos;s Google Classroom. Each of your classes has its own link; all of them save to your one Google Sheet.</p>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={link} aria-label="Class link" className="font-mono text-xs" />
          <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(link); setCopied(true); }}><Copy className="size-4" aria-hidden /> {copied ? "Copied" : "Copy"}</Button>
        </div>
      </Card>
      <RightNow live={data.live} name={name} revisions={revisions} />
      <Card>
        <CardTitle>Mission completion</CardTitle>
        <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto text-sm">
          {path.map(({ lesson, week }) => {
            const n = data.progress.filter((p) => p.lessonId === lesson.id && p.status === "completed").length;
            return <li key={lesson.id} className="flex gap-2"><span className="w-8 font-mono text-xs text-muted">W{week}</span><a href={`#/lesson/${lesson.id}`} className="flex-1 hover:text-primary hover:underline">{lesson.title}</a><span className="font-mono text-xs">{n}/{data.students.length}</span></li>;
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

function Review({ queue, name, apiUrl, onSaved, galleryIds }: { queue: Ev[]; name: (e: string) => string; apiUrl: string; onSaved: () => void; galleryIds: string[] }) {
  if (!queue.length) return <EmptyState title="Nothing waiting for review" />;
  return <ul className="space-y-4">{queue.map((e) => <li key={e.id}><ReviewCard e={e} name={name(e.email)} apiUrl={apiUrl} onSaved={onSaved} inGallery={galleryIds.includes(e.id)} /></li>)}</ul>;
}

function ReviewCard({ e, name, apiUrl, onSaved, inGallery }: { e: Ev; name: string; apiUrl: string; onSaved: () => void; inGallery: boolean }) {
  const [shown, setShown] = useState(inGallery);
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
      <button className="ml-3 mt-3 text-sm font-semibold text-primary underline" disabled={busy} onClick={async () => {
        const caption = shown ? "" : prompt("Caption for the class gallery (optional, e.g. what's great about it):") ?? "";
        setBusy(true);
        const r = await call(apiUrl, "galleryToggle", { evidenceId: e.id, on: !shown, caption });
        setBusy(false);
        if (r.ok) setShown(!shown); else setErr(r.error);
      }}>{shown ? "★ In class gallery (remove)" : "☆ Add to class gallery"}</button>
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
    </Card>
  );
}

function Roster({ data, apiUrl, onSaved, onClassesChanged }: { data: ClassData; apiUrl: string; onSaved: () => void; onClassesChanged: () => void }) {
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
              {courses.map((c) => {
                const linked = data.classes.find((x) => x.googleCourseId === c.id);
                const run = async (asNewClass: boolean) => {
                  setBusy(true);
                  const r = await call<{ added: number; classId: string }>(apiUrl, "importClassroom", { courseId: c.id, asNewClass, pathId: data.cls.pathId });
                  setBusy(false);
                  setMsg(r.ok ? `Imported — ${r.data.added} student(s) added.` : r.error);
                  if (r.ok) { onSaved(); if (asNewClass) onClassesChanged(); }
                };
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2">
                    <span className="flex-1 font-semibold">{c.name}{c.section && ` · ${c.section}`}</span>
                    {linked ? (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(false)}>Sync “{linked.name}”</Button>
                    ) : (
                      <>
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(false)}>Add to this class</Button>
                        <Button size="sm" disabled={busy} onClick={() => run(true)}>Import as new class</Button>
                      </>
                    )}
                  </li>
                );
              })}
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

function NewClassForm({ apiUrl, onCreated }: { apiUrl: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [pathId, setPathId] = useState("18-week");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await call<ClassInfo>(apiUrl, "createClass", { name, section, pathId });
      setBusy(false);
      if (r.ok) { setCurrentClass(r.data.id); setName(""); setSection(""); onCreated(); }
      else { setErr(r.error); onCreated(); /* the class may have been saved even though the reply was lost */ }
    }}>
      <Field label="Class name" htmlFor="nc-n"><Input id="nc-n" value={name} onChange={(e) => setName(e.target.value)} required placeholder="3D Design" /></Field>
      <Field label="Section / period" htmlFor="nc-s"><Input id="nc-s" value={section} onChange={(e) => setSection(e.target.value)} placeholder="Period 2" /></Field>
      <Field label="Course length" htmlFor="nc-p"><Select id="nc-p" value={pathId} onChange={(e) => setPathId(e.target.value)}><option value="18-week">18 weeks</option><option value="9-week">9 weeks</option></Select></Field>
      <Button disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create class"}</Button>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </form>
  );
}

function setCurrentClass(id: string) {
  setCurrentClassId(id);
}

function Classes({ data, apiUrl, onChange }: { data: ClassData; apiUrl: string; onChange: () => void }) {
  const c = data.cls;
  const [form, setForm] = useState({ name: c.name, section: c.section, pathId: c.pathId, tinkercadUrl: c.tinkercadUrl ?? "", unlockAll: c.unlockAll });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (patch: Record<string, unknown>) => {
    setBusy(true);
    const r = await call(apiUrl, "updateClass", { classId: c.id, ...patch });
    setBusy(false);
    setMsg(r.ok ? "Saved" : r.error);
    if (r.ok) onChange();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle>This class</CardTitle>
        <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); void save(form); }}>
          <Field label="Name" htmlFor="cl-n"><Input id="cl-n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Section / period" htmlFor="cl-s"><Input id="cl-s" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></Field>
          <Field label="Course length" htmlFor="cl-p" hint="Switching keeps all student work."><Select id="cl-p" value={form.pathId} onChange={(e) => setForm({ ...form, pathId: e.target.value })}><option value="18-week">18 weeks</option><option value="9-week">9 weeks</option></Select></Field>
          <Field label="Tinkercad Classroom link" htmlFor="cl-t"><Input id="cl-t" type="url" value={form.tinkercadUrl} onChange={(e) => setForm({ ...form, tinkercadUrl: e.target.value })} placeholder="https://www.tinkercad.com/joinclass/…" /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.unlockAll} onChange={(e) => setForm({ ...form, unlockAll: e.target.checked })} /> Unlock every mission (e.g. Tinkercad is down)</label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy}>Save</Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => { if (confirm(`Archive ${c.name}? Student work stays in your Sheet.`)) void save({ archived: true }); }}>Archive class</Button>
          </div>
          {msg && <p role="status" className="text-sm">{msg}</p>}
        </form>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardTitle>All my classes</CardTitle>
          <ul className="mt-3 space-y-2">
            {data.classes.map((x) => (
              <li key={x.id} className="flex items-center gap-2">
                <span className="flex-1"><span className="font-semibold">{x.name}</span>{x.section && <span className="text-muted"> · {x.section}</span>} <Pill>{x.pathId}</Pill></span>
                {x.id === c.id ? <Pill tone="primary">Viewing</Pill> : <Button size="sm" variant="secondary" onClick={() => { setCurrentClass(x.id); onChange(); }}>Open</Button>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>New class</CardTitle>
          <div className="mt-3"><NewClassForm apiUrl={apiUrl} onCreated={onChange} /></div>
        </Card>
      </div>
    </div>
  );
}

/** Who needs the teacher right now: stuck, quiet, and the questions most students have wrong. */
function RightNow({ live, name, revisions }: { live?: Live; name: (e: string) => string; revisions: Ev[] }) {
  const title = (lessonId: string) => lessonById.get(lessonId)?.title ?? lessonId;
  const qLabel = (lessonId: string, blockId: string) => {
    const l = lessonById.get(lessonId);
    const b = l?.sections.flatMap((x) => x.blocks).find((x) => x.id === blockId);
    return b && "prompt" in b ? String(b.prompt).replace(/[*_`#]/g, "").slice(0, 90) : blockId;
  };
  if (!live) return null;
  const empty = !live.stuck.length && !live.quiet.length && !live.missed.length && !revisions.length;
  return (
    <section aria-labelledby="now-h" className="rounded-3xl border-2 border-accent bg-surface p-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 id="now-h" className="font-display text-xl font-bold">Right now</h2>
        <span className="text-xs text-muted">updates every minute · {new Date(live.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
      </div>
      {empty && <p className="mt-2 text-muted">Nobody is stuck right now.</p>}
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {live.stuck.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><span className="size-3 rounded-full bg-danger" aria-hidden />Stuck ({live.stuck.length})</h3>
            <p className="text-xs text-muted">3+ tries, still not right</p>
            <ul className="mt-2 space-y-2 text-sm">
              {live.stuck.slice(0, 12).map((x, i) => (
                <li key={i} className="rounded-xl bg-danger-soft p-2"><strong>{name(x.email)}</strong> · {x.attempts} tries<br /><span className="text-muted">{title(x.lessonId)}: “{qLabel(x.lessonId, x.blockId)}”</span></li>
              ))}
            </ul>
          </div>
        )}
        {live.quiet.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><span className="size-3 rounded-full bg-warning" aria-hidden />Quiet ({live.quiet.length})</h3>
            <p className="text-xs text-muted">In a mission, no answer for 10+ min</p>
            <ul className="mt-2 space-y-2 text-sm">
              {live.quiet.map((x) => <li key={x.email} className="rounded-xl bg-warning-soft p-2"><strong>{name(x.email)}</strong> · {x.minutes} min<br /><span className="text-muted">{title(x.lessonId)}</span></li>)}
            </ul>
          </div>
        )}
        {live.missed.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><span className="size-3 rounded-full bg-primary" aria-hidden />Most missed</h3>
            <p className="text-xs text-muted">Worth a 2-minute whole-class reteach</p>
            <ol className="mt-2 space-y-2 text-sm">
              {live.missed.map((m) => <li key={m.lessonId + m.blockId} className="rounded-xl bg-primary-soft p-2"><strong>{m.count} student{m.count === 1 ? "" : "s"}</strong> · {title(m.lessonId)}<br /><span className="text-muted">“{m.prompt || qLabel(m.lessonId, m.blockId)}”</span></li>)}
            </ol>
          </div>
        )}
      </div>
      {revisions.length > 0 && (
        <p className="mt-4 text-sm"><strong>Revisions requested:</strong> {revisions.map((e) => `${name(e.email)} (${title(e.lessonId)})`).join(", ")}</p>
      )}
    </section>
  );
}

const PRINT_LABELS: Record<string, string> = { queued: "Queue", redo: "Redo", printing: "Printing", printed: "Printed", failed: "Failed", cancelled: "Cancelled" };
const PRINT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  queued: [{ status: "printing", label: "Start printing" }, { status: "redo", label: "Send to redo" }, { status: "cancelled", label: "Cancel" }],
  redo: [{ status: "queued", label: "Return to queue" }, { status: "cancelled", label: "Cancel" }],
  printing: [{ status: "printed", label: "Mark printed" }, { status: "failed", label: "Mark failed" }, { status: "redo", label: "Send to redo" }],
  printed: [{ status: "queued", label: "Reprint" }],
  failed: [{ status: "queued", label: "Return to queue" }, { status: "redo", label: "Send to redo" }],
  cancelled: [{ status: "queued", label: "Reopen" }],
};

type Reward = { id: string; name: string; description: string; price: number; active: boolean };
type RewardRequest = { id: string; email: string; studentName: string; name: string; price: number; status: string; teacherNote: string; createdAt: string };
const REWARD_IDEAS: { name: string; description: string; price: number }[] = [
  { name: "Pick the filament color", description: "For your next print", price: 200 },
  { name: "Front of the print queue", description: "Your next print goes first", price: 400 },
  { name: "Choose the class music", description: "10 minutes during work time", price: 250 },
  { name: "Print a design of your choice", description: "Small, under 1 hour, teacher-approved", price: 600 },
  { name: "Be the class tech helper", description: "Help classmates for a day", price: 150 },
  { name: "Show your design to the class", description: "2-minute spotlight", price: 100 },
];

/** Classroom perks the teacher creates. Students spend XP to ask; the teacher approves, declines (XP back) or marks given. */
function Rewards({ apiUrl }: { apiUrl: string }) {
  const [data, setData] = useState<{ rewards: Reward[]; requests: RewardRequest[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "200" });
  const run = useCallback(async (action: string, args: Record<string, unknown> = {}) => {
    setBusy(true);
    const r = await call<{ rewards: Reward[]; requests: RewardRequest[] }>(apiUrl, action, args);
    setBusy(false);
    if (r.ok) { setData(r.data); setErr(null); return true; }
    setErr(r.error);
    return false;
  }, [apiUrl]);
  useEffect(() => { void run("rewards"); }, [run]);
  if (!data) return <p role="status" className="py-10 text-center text-muted">{err ?? "Loading rewards…"}</p>;
  const pending = data.requests.filter((q) => q.status === "requested");
  const approved = data.requests.filter((q) => q.status === "approved");
  return (
    <div className="space-y-6">
      {err && <Alert tone="danger">{err}</Alert>}
      <Card>
        <CardTitle>Requests waiting ({pending.length})</CardTitle>
        {pending.length === 0 && approved.length === 0 ? <p className="mt-2 text-sm text-muted">No requests right now.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {[...pending, ...approved].map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1"><strong>{q.studentName}</strong> · {q.name} <span className="text-muted">({q.price} XP)</span> {q.status === "approved" && <Pill tone="success">approved</Pill>}</span>
                {q.status === "requested" && <Button size="sm" disabled={busy} onClick={() => void run("decideReward", { id: q.id, status: "approved" })}>Approve</Button>}
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run("decideReward", { id: q.id, status: "given" })}>Mark given</Button>
                {q.status === "requested" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { const note = prompt("Optional note for the student (they get their XP back):") ?? ""; void run("decideReward", { id: q.id, status: "declined", note }); }}>Decline</Button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle>Your class rewards</CardTitle>
        <p className="mt-1 text-sm text-muted">Real perks students can spend XP on. Keep them fun, not academic (no grade boosts), so every student can earn them by learning.</p>
        <ul className="mt-3 divide-y divide-border">
          {data.rewards.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <span className={cn("min-w-0 flex-1", !w.active && "text-muted line-through")}><strong>{w.name}</strong> · {w.price} XP {w.description && <span className="text-muted">— {w.description}</span>}</span>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run("saveReward", { ...w, active: !w.active })}>{w.active ? "Hide" : "Show"}</Button>
            </li>
          ))}
          {data.rewards.length === 0 && <li className="py-2 text-sm text-muted">None yet. Add one below or start from an idea.</li>}
        </ul>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_7rem_auto] sm:items-end"
          onSubmit={(e) => { e.preventDefault(); void run("saveReward", { name: form.name, description: form.description, price: Number(form.price) }).then((ok) => ok && setForm({ name: "", description: "", price: "200" })); }}
        >
          <Field label="Reward" htmlFor="rw-name"><Input id="rw-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pick the filament color" /></Field>
          <Field label="Details (optional)" htmlFor="rw-desc"><Input id="rw-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Price (XP)" htmlFor="rw-price"><Input id="rw-price" type="number" min={10} max={5000} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Button disabled={busy}>Add reward</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-muted">Ideas:</span>
          {REWARD_IDEAS.filter((i) => !data.rewards.some((w) => w.name === i.name)).map((i) => (
            <button key={i.name} className="rounded-full border border-border px-3 py-1 text-sm hover:bg-surface-2" onClick={() => setForm({ name: i.name, description: i.description, price: String(i.price) })}>+ {i.name}</button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">For scale: a student earns roughly 100–200 XP in a typical mission, and the daily goal is 50.</p>
      </Card>
    </div>
  );
}

function Prints({ jobs, name, apiUrl, onSaved }: { jobs: PrintJob[]; name: (e: string) => string; apiUrl: string; onSaved: () => void }) {
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<{ error: string } | null>(null);
  const shown = jobs.filter((j) => filter === "all" || ["queued", "redo", "printing"].includes(j.status)).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const save = async (id: string, patch: { status?: string; teacherNote?: string }) => {
    setBusy(id);
    const r = await call(apiUrl, "updatePrint", { printId: id, ...patch });
    setBusy(null);
    if (r.ok) { setErr(null); onSaved(); } else setErr(r);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted">Student STL files enter the queue. Send one to redo with clear feedback, start the print, then mark it printed. Oldest first.</p>
        <div className="ml-auto flex gap-1" role="group" aria-label="Show">
          {(["open", "all"] as const).map((f) => <Button key={f} size="sm" variant={filter === f ? "primary" : "secondary"} onClick={() => setFilter(f)}>{f === "open" ? "To do" : "All"}</Button>)}
        </div>
      </div>
      {err && <FriendlyError {...err} />}
      {!shown.length && <EmptyState title={filter === "open" ? "No prints waiting" : "No print requests yet"}>When a student checks “send to the print queue” on an STL upload, it shows up here.</EmptyState>}
      <ul className="space-y-3">
        {shown.map((j) => (
          <li key={j.id}>
            <Card className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{name(j.email)}</strong>
                <span className="text-sm text-muted">{lessonById.get(j.lessonId)?.title} · {new Date(j.createdAt).toLocaleDateString()}</span>
                <Pill tone={j.status === "printed" ? "success" : j.status === "failed" || j.status === "redo" ? "danger" : j.status === "printing" ? "accent" : "neutral"}>{PRINT_LABELS[j.status] ?? j.status}</Pill>
                {j.fileUrl && <a href={j.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm font-semibold text-primary underline">{j.fileName ?? "Open file"} ↗</a>}
              </div>
              {j.note && <p className="rounded-lg bg-surface-2 p-2 text-sm">Student: {j.note}</p>}
              <div className="flex flex-wrap gap-1" role="group" aria-label="Next print step">
                {(PRINT_ACTIONS[j.status] ?? []).map((p) => (
                  <Button key={p.status} size="sm" variant={p.status === "redo" ? "secondary" : "primary"} disabled={busy === j.id} onClick={() => {
                    if (p.status !== "redo" || j.teacherNote.trim()) { void save(j.id, { status: p.status }); return; }
                    const note = window.prompt("What should the student change before printing?");
                    if (note?.trim()) void save(j.id, { status: p.status, teacherNote: note.trim() });
                  }}>{p.label}</Button>
                ))}
              </div>
              <PrintNote job={j} onSave={(t) => void save(j.id, { teacherNote: t })} />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrintNote({ job, onSave }: { job: PrintJob; onSave: (t: string) => void }) {
  const [t, setT] = useState(job.teacherNote);
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSave(t); }}>
      <Input aria-label="Note to student" placeholder="Note to student (e.g. pick up in bin 3)" value={t} onChange={(e) => setT(e.target.value)} />
      <Button size="sm" variant="secondary" disabled={t === job.teacherNote}>Save</Button>
    </form>
  );
}

/** Every lesson, always open to teachers and admins — browse, preview like a student, or print handouts. */
function LessonLibrary({ data }: { data: ClassData }) {
  const [q, setQ] = useState("");
  const inPath = pathLessons(data.cls.pathId);
  const pathIds = new Set(inPath.map((x) => x.lesson.id));
  const extra = allLessons.filter((l) => !pathIds.has(l.id)).sort((a, b) => a.number - b.number);
  const match = (title: string, subtitle: string) => !q.trim() || `${title} ${subtitle}`.toLowerCase().includes(q.trim().toLowerCase());
  const done = (id: string) => data.progress.filter((p) => p.lessonId === id && p.status === "completed").length;
  const row = (lesson: (typeof allLessons)[number], week: number | null) => {
    if (!match(lesson.title, lesson.subtitle)) return null;
    const offline = offlineChallenges(lesson).length > 0;
    return (
      <li key={lesson.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3">
        <span className="w-10 font-mono text-xs text-muted">{week ? `W${week}` : "—"}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{lesson.title}</span>
          <span className="block truncate text-sm text-muted">{lesson.subtitle} · {lesson.estimatedMinutes} min</span>
        </span>
        {lesson.kind === "boss" && <Pill tone="accent">Boss</Pill>}
        {offline && <Pill tone="warning">Has offline work</Pill>}
        <span className="font-mono text-xs text-muted" title="Students in this class who completed it">{done(lesson.id)}/{data.students.length} done</span>
        <a href={`#/lesson/${lesson.id}`} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg hover:brightness-110">Open</a>
        {offline && <a href={`#/print/${lesson.id}`} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface-2">Handout</a>}
      </li>
    );
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">All lessons are open to teachers and admins at any time. Opening one shows it exactly as students see it; your answers go to your own test record, not to the class.</p>
      <Input aria-label="Search lessons" placeholder="Search lessons…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="space-y-2">{inPath.map(({ lesson, week }) => row(lesson, week))}</ul>
      {extra.length > 0 && (
        <>
          <h3 className="pt-2 font-display text-lg font-bold">Also available (not in this class&rsquo;s course length)</h3>
          <ul className="space-y-2">{extra.map((l) => row(l, null))}</ul>
        </>
      )}
    </div>
  );
}
