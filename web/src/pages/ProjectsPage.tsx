import { useState } from "react";
import { Eye } from "lucide-react";
import { Alert, Card, Pill } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import type { Lesson } from "@/content/schema";
import { call } from "../api";
import { lessonById, type ClassInfo, type Me } from "../content";
import { assignProject, PROJECT_TEMPLATES, projectMissions, type CustomPath } from "../custom-path";

/**
 * Teacher page: every project in the course, ready to assign. Assigning one sets the class's course to the lessons
 * the project builds on, in order, ending with the project (a custom project path, editable in Classes afterwards).
 * Student work is kept; only the order of missions changes.
 */

const KIND: Record<string, string> = { boss: "Boss project", challenge: "Challenge", lab: "Lab", capstone: "Capstone", showcase: "Showcase" };
const isJunior = (l: Lesson) => l.id.startsWith("jr-");
const time = (minutes: number) => (minutes < 120 ? `about ${Math.round(minutes / 5) * 5} min` : `about ${Math.round(minutes / 60)} hours`);
const pathMinutes = (ids: string[]) => ids.reduce((n, id) => n + (lessonById.get(id)?.estimatedMinutes ?? 0), 0);
const lessonsBefore = (c: CustomPath) => (c.project ? c.lessonIds.length - 1 : c.lessonIds.length);

type Item = { key: string; title: string; kind: string; about: string; path: CustomPath; preview?: string; junior: boolean; extra?: string[] };

export function ProjectsPage({ me, apiUrl, onChange }: { me: Me; apiUrl: string; onChange: () => void }) {
  const [classId, setClassId] = useState(me.cls?.id ?? me.classes[0]?.id ?? "");
  const [grade, setGrade] = useState<"all" | "older" | "junior">("all");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);
  const cls: ClassInfo | undefined = me.classes.find((c) => c.id === classId);

  const missions: Item[] = projectMissions().flatMap((l) => {
    const path = assignProject(l.id);
    return path ? [{ key: l.id, title: l.title, kind: KIND[l.kind] ?? "Project", about: l.summary, path, preview: `#/lesson/${l.id}`, junior: isJunior(l) }] : [];
  });
  const briefs: Item[] = PROJECT_TEMPLATES.map((t) => ({
    key: `brief:${t.id}`, title: t.title, kind: "Project brief", about: t.brief, junior: false, extra: t.requirements,
    path: { title: t.title, brief: t.brief, lessonIds: t.lessonIds, requirements: t.requirements, project: null },
  }));
  const shown = (xs: Item[]) => xs.filter((x) => grade === "all" || (grade === "junior") === x.junior);
  const assignedHere = (x: Item) => cls?.pathId === "custom" && !!cls.custom && (x.path.project ? cls.custom.project === x.path.project : !cls.custom.project && cls.custom.title === x.title);

  const assign = async (x: Item) => {
    if (!cls) return;
    setBusy(true);
    setMsg(null);
    const r = await call<ClassInfo>(apiUrl, "updateClass", { classId: cls.id, pathId: "custom", custom: x.path });
    setBusy(false);
    setConfirm(null);
    // A Sheet that hasn't installed the latest app version saves the lessons but can't end the path with the project.
    const saved = r.ok ? r.data.custom : null;
    const outdated = !!x.path.project && (!saved || saved.project !== x.path.project);
    setMsg(!r.ok
      ? { tone: "danger", text: r.error }
      : outdated
        ? { tone: "warning", text: `Saved, but your class Sheet needs the latest update to end ${cls.name}'s path with “${x.title}”. On your dashboard, click Update now, then assign this project again.` }
        : { tone: "success", text: `Assigned. ${cls.name} now follows “${x.title}”. Students see it the next time they open their missions, and their work so far is kept. To change the lessons, open Teacher → Classes → Custom project path.` });
    if (r.ok) onChange();
  };

  if (!me.classes.length) {
    return <Alert tone="warning" title="Create a class first">Then come back here to assign a project. <a className="underline" href="#/teacher">Go to your dashboard</a></Alert>;
  }

  const card = (x: Item) => {
    const n = lessonsBefore(x.path);
    const here = assignedHere(x);
    return (
      <li key={x.key} className={`flex flex-col rounded-2xl border bg-surface p-4 ${here ? "border-primary" : "border-border"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill>{x.kind}</Pill>
          {x.junior && <Pill>Grades 4–5</Pill>}
          {here && <Pill tone="primary">Assigned to this class</Pill>}
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug">{x.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm text-muted">{x.about}</p>
        {x.extra && x.extra.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">{x.extra.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
        )}
        <p className="mt-3 flex-1 text-sm">{n === 0 ? "No lessons needed first" : `${n} lesson${n === 1 ? "" : "s"} first`} · {time(pathMinutes(x.path.lessonIds))} in all</p>
        {confirm === x.key ? (
          <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm" role="group" aria-label={`Assign ${x.title}`}>
            <p><b>{cls?.name}</b> will follow {n === 0 ? "" : `${n} lesson${n === 1 ? "" : "s"}, then `}{x.path.project ? x.title : "its own project mission"}. Student work so far is kept.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => void assign(x)}>{busy ? "Assigning…" : "Yes, assign it"}</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy || here} onClick={() => { setMsg(null); setConfirm(x.key); }} aria-label={`Assign ${x.title} to ${cls?.name ?? "class"}`}>{here ? "Assigned" : "Assign"}</Button>
            {x.preview && <a href={x.preview} className={buttonClass("secondary", "sm")}><Eye className="size-4" aria-hidden /> Preview</a>}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Projects</h1>
        <p className="mt-1 text-muted">Every project in the course, ready to assign. Students get the lessons a project builds on, in order, ending with the project.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-semibold">
            Assign to
            <select className="mt-1 block h-10 rounded-lg border border-border bg-surface px-2 font-normal" value={classId} onChange={(e) => { setClassId(e.target.value); setConfirm(null); setMsg(null); }}>
              {me.classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ""}</option>)}
            </select>
          </label>
          <fieldset className="text-sm">
            <legend className="font-semibold">Show</legend>
            <div className="mt-1 flex flex-wrap gap-1">
              {([["all", "All"], ["older", "Grades 6+"], ["junior", "Grades 4–5"]] as const).map(([v, label]) => (
                <button key={v} aria-pressed={grade === v} onClick={() => setGrade(v)} className={`h-10 rounded-lg border px-3 font-semibold ${grade === v ? "border-primary bg-primary text-primary-fg" : "border-border hover:bg-surface-2"}`}>{label}</button>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      {msg && <div role="status"><Alert tone={msg.tone}>{msg.text}</Alert></div>}

      <section aria-labelledby="pm-h" className="space-y-3">
        <h2 id="pm-h" className="font-display text-xl font-bold">Project missions</h2>
        <p className="text-sm text-muted">Built-in projects with their own steps, checklists and teacher guide.</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown(missions).map(card)}</ul>
      </section>

      {shown(briefs).length > 0 && (
        <section aria-labelledby="pb-h" className="space-y-3">
          <h2 id="pb-h" className="font-display text-xl font-bold">Project briefs</h2>
          <p className="text-sm text-muted">Real-world design briefs. Students practise the lessons, then design to the brief and its requirements. You can edit the brief after assigning it.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown(briefs).map(card)}</ul>
        </section>
      )}
    </div>
  );
}
