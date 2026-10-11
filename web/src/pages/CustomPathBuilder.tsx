import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, X } from "lucide-react";
import { Alert, Card, CardTitle, Pill } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { call } from "../api";
import { competencyTitle, lessonById, lessons as allLessons, type ClassInfo } from "../content";
import { decodeShareCode, encodeShareCode, missingPrerequisites, PROJECT_ID, PROJECT_TEMPLATES, type CustomPath } from "../custom-path";

/**
 * Teacher tool: pick and order existing lessons for this class, ending with their own project mission. The project
 * counts toward every skill in the picked lessons when the teacher reviews it.
 */
export function CustomPathBuilder({ cls, apiUrl, onSaved }: { cls: ClassInfo; apiUrl: string; onSaved: () => void }) {
  const start = cls.custom;
  const [open, setOpen] = useState(!!start || cls.pathId === "custom");
  const [title, setTitle] = useState(start?.title ?? "");
  const [brief, setBrief] = useState(start?.brief ?? "");
  const [ids, setIds] = useState<string[]>(start?.lessonIds ?? []);
  const [reqs, setReqs] = useState((start?.requirements ?? []).join("\n"));
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const draft: CustomPath = { title: title.trim(), brief: brief.trim(), lessonIds: ids, requirements: reqs.split("\n").map((r) => r.trim()).filter(Boolean).slice(0, 8) };
  const picked = ids.map((id) => lessonById.get(id)).filter((l): l is NonNullable<typeof l> => !!l);
  const minutes = picked.reduce((n, l) => n + l.estimatedMinutes, 0);
  const skills = [...new Set(picked.flatMap((l) => l.competencyIds))];
  const gaps = missingPrerequisites(ids);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return allLessons
      .filter((l) => l.id !== PROJECT_ID && !ids.includes(l.id))
      .filter((l) => !s || `${l.title} ${l.subtitle} ${l.summary}`.toLowerCase().includes(s))
      .sort((a, b) => a.number - b.number)
      .slice(0, s ? 20 : 12);
  }, [q, ids]);

  const load = (c: CustomPath) => { setTitle(c.title); setBrief(c.brief); setIds(c.lessonIds); setReqs(c.requirements.join("\n")); setMsg(null); };
  const move = (i: number, d: number) => setIds((xs) => { const n = [...xs]; const [x] = n.splice(i, 1); n.splice(Math.max(0, Math.min(n.length, i + d)), 0, x); return n; });
  const addBefore = (id: string, before: string) => setIds((xs) => { const n = xs.filter((x) => x !== id); const at = n.indexOf(before); n.splice(at < 0 ? n.length : at, 0, id); return n; });
  const save = async () => {
    if (!draft.lessonIds.length) { setMsg({ tone: "danger", text: "Add at least one lesson." }); return; }
    if (!draft.title) { setMsg({ tone: "danger", text: "Give the project a title." }); return; }
    setBusy(true);
    const r = await call(apiUrl, "updateClass", { classId: cls.id, pathId: "custom", custom: draft });
    setBusy(false);
    setMsg(r.ok ? { tone: "success", text: `Saved. ${cls.name} now follows this project path; student work is kept.` } : { tone: "danger", text: r.error });
    if (r.ok) onSaved();
  };

  if (!open) {
    return (
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Custom project path</CardTitle>
            <p className="mt-1 text-sm text-muted">Pick only the lessons your students need for a project, in your order, ending with your own project mission. Reviewing the project credits every skill in the path.</p>
          </div>
          <Button variant="secondary" onClick={() => setOpen(true)}>Build a project path</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>Custom project path</CardTitle>
        {cls.pathId === "custom" && <Pill tone="primary">In use for this class</Pill>}
      </div>
      <p className="mt-1 text-sm text-muted">Start from a template or from scratch. Students see these lessons in this order, then your project as the final mission.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PROJECT_TEMPLATES.map((t) => <Button key={t.id} size="sm" variant="secondary" onClick={() => load(t)}>{t.label}</Button>)}
        <Button size="sm" variant="ghost" onClick={() => load({ title: "", brief: "", lessonIds: [], requirements: [] })}>Start blank</Button>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Project title" htmlFor="cp-t"><Input id="cp-t" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Phone stand for someone at home" /></Field>
          <Field label="Brief (what students design, and for whom)" htmlFor="cp-b"><Textarea id="cp-b" rows={3} value={brief} maxLength={600} onChange={(e) => setBrief(e.target.value)} /></Field>
          <Field label="Requirements (one per line, up to 8)" htmlFor="cp-r" hint="Students check these off; you rate the project against them."><Textarea id="cp-r" rows={4} value={reqs} onChange={(e) => setReqs(e.target.value)} placeholder={"Fits the real phone\nPrints with no supports"} /></Field>

          <div>
            <h3 className="font-semibold">Add lessons</h3>
            <Input aria-label="Search lessons" className="mt-2" placeholder="Search: holes, text, supports…" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
              {results.map((l) => (
                <li key={l.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm">
                  <span className="min-w-0 flex-1"><span className="font-semibold">{l.title}</span> <span className="text-muted">· {l.estimatedMinutes} min</span></span>
                  {l.id.startsWith("jr-") && <Pill>Gr 4–5</Pill>}
                  <Button size="sm" variant="ghost" onClick={() => setIds([...ids, l.id])} aria-label={`Add ${l.title}`}><Plus className="size-4" aria-hidden /> Add</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Student path ({picked.length} lessons · about {Math.round(minutes / 5) * 5} min · {skills.length} skills)</h3>
          {picked.length === 0 && <p className="text-sm text-muted">No lessons yet. Pick a template or add lessons.</p>}
          <ol className="space-y-1">
            {picked.map((l, i) => (
              <li key={l.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm">
                <span className="w-6 font-mono text-xs text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 font-semibold">{l.title}</span>
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${l.title} up`}><ArrowUp className="size-4" aria-hidden /></Button>
                <Button size="sm" variant="ghost" disabled={i === picked.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${l.title} down`}><ArrowDown className="size-4" aria-hidden /></Button>
                <Button size="sm" variant="ghost" onClick={() => setIds(ids.filter((x) => x !== l.id))} aria-label={`Remove ${l.title}`}><X className="size-4" aria-hidden /></Button>
              </li>
            ))}
            {picked.length > 0 && (
              <li className="flex items-center gap-2 rounded-xl border border-accent bg-accent-soft px-3 py-1.5 text-sm">
                <span className="w-6 font-mono text-xs text-muted">★</span>
                <span className="min-w-0 flex-1 font-semibold">Your project: {draft.title || "(add a title)"}</span>
                <span className="text-xs text-muted">final mission</span>
              </li>
            )}
          </ol>

          {gaps.length > 0 && (
            <Alert tone="warning" title="These lessons build on skills that aren't in the path">
              <ul className="mt-1 space-y-1">
                {gaps.map((g) => (
                  <li key={g.lessonId} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1">{lessonById.get(g.neededBy)?.title} builds on <strong>{lessonById.get(g.lessonId)?.title}</strong></span>
                    <Button size="sm" variant="secondary" onClick={() => addBefore(g.lessonId, g.neededBy)}>Add it</Button>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs">Fine to skip if students already learned it.</p>
            </Alert>
          )}

          {skills.length > 0 && (
            <div>
              <p className="text-sm font-semibold">The project counts toward:</p>
              <p className="mt-1 flex flex-wrap gap-1">{skills.map((s) => <Pill key={s}>{competencyTitle[s] ?? s}</Pill>)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save and use for this class"}</Button>
        <Button variant="secondary" disabled={!picked.length} onClick={() => { const c = encodeShareCode(draft); navigator.clipboard?.writeText(c).then(() => setMsg({ tone: "info", text: "Share code copied. Another teacher can paste it here to load this path." }), () => prompt("Copy this share code:", c)); }}><Copy className="size-4" aria-hidden /> Copy share code</Button>
        <form className="flex min-w-[14rem] flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); const c = decodeShareCode(code); if (c) { load(c); setCode(""); setMsg({ tone: "info", text: "Loaded. Review it, then save." }); } else setMsg({ tone: "danger", text: "That share code didn't work. Copy it again from the other teacher." }); }}>
          <Input aria-label="Paste a share code" placeholder="Paste a share code (3DA1.…)" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" variant="ghost" disabled={!code.trim()}>Load</Button>
        </form>
      </div>
      {msg && <div className="mt-3"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
    </Card>
  );
}
