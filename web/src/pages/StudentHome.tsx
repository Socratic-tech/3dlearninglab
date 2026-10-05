import { tr, trn } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Printer, RotateCcw } from "lucide-react";
import { Pill } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { call } from "../api";
import { Avatar, itemName, XpStore } from "../store";
import { StreakCard } from "@/components/student/mission-path";
import { NextUpPath } from "@/components/student/next-up";
import { allBlocks, isRequiredBlock } from "@/content/schema";
import { ProgressRing, ProgressBar } from "@/components/ui/progress";
import { rank } from "@/lib/mastery";
import { competencies, domainsFor, lessonFor, pathTitle, type Me } from "../content";
import { isStaff, setStudentView, studentStates, useStudentView } from "../state";

export function StudentHome({ me, apiUrl, onChange }: { me: Me; apiUrl: string; onChange: () => void }) {
  const studentView = useStudentView();
  const { items, states } = studentStates(me);
  const done = items.filter((x) => states.get(x.lesson.id) === "completed").length;
  const inPath = new Set(items.flatMap((x) => x.lesson.competencyIds));
  const mastered = [...inPath].filter((c) => rank(me.levels[c]) >= 2).length;
  return (
    <div className="space-y-8">
      <section className="bg-blueprint flex items-center gap-4 rounded-3xl border border-border bg-surface p-4 sm:gap-6 sm:p-6">
        {me.store?.equipped ? <Avatar eq={me.store.equipped} size={76} label={tr("Your avatar")} /> : <ProgressRing value={inPath.size ? (mastered / inPath.size) * 100 : 0} size={76} stroke={8} label={tr("Skills mastered")} />}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr("Welcome back")}</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{me.user.name.split(" ")[0]}</h1>
          {me.store?.equipped?.title && <p className="font-display text-sm font-bold text-accent">★ {itemName(me.store.equipped.title)}</p>}
          <p className="text-sm text-muted sm:text-base">{tr("{m} of {n} skills mastered · {d} of {t} missions done", { m: mastered, n: inPath.size, d: done, t: items.length })}</p>
        </div>
      </section>

      {isStaff(me) && !studentView && (
        <div role="note" className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-primary-soft px-4 py-3 text-sm">
          <p className="min-w-0 flex-1"><strong>{tr("Teacher view:")}</strong> {tr("every mission is open to you, no matter what's completed. Students still unlock them in order.")}</p>
          <button className="rounded-lg border border-primary px-3 py-1.5 font-semibold text-primary hover:bg-surface" onClick={() => setStudentView(true)}>{tr("See it as a student")}</button>
        </div>
      )}
      <NextUpPath
        items={items.map((x) => {
          const st = states.get(x.lesson.id) ?? "locked";
          const req = allBlocks(x.lesson).filter(isRequiredBlock).map((b) => b.id);
          const saved = me.progress[x.lesson.id]?.blockState ?? {};
          return {
            id: x.lesson.id,
            title: x.lesson.title,
            subtitle: x.lesson.subtitle,
            minutes: x.lesson.estimatedMinutes,
            kind: x.lesson.kind,
            state: st,
            href: `#/lesson/${x.lesson.id}`,
            week: x.week,
            weekTitle: x.weekTitle,
            steps: st === "in_progress" ? { done: req.filter((id) => id in saved).length, total: req.length } : undefined,
          };
        })}
      />
      {me.stats && <StreakCard stats={me.stats} />}
      {me.stats && me.store && !isStaff(me) && <XpStore store={me.store} apiUrl={apiUrl} onChange={onChange} />}

      <ReviewDeck me={me} />


      <MyPrints me={me} apiUrl={apiUrl} onChange={onChange} />

      <section aria-labelledby="sk-h" className="rounded-3xl border border-border bg-surface p-6">
        <h2 id="sk-h" className="font-display text-2xl font-bold">{tr("My skills")}</h2>
        <ul className="mt-4 space-y-3">
          {domainsFor().map((d) => {
            const ids = competencies.filter((c) => c.domain === d.id && inPath.has(c.id)).map((c) => c.id);
            if (!ids.length) return null;
            const v = Math.round((ids.filter((c) => rank(me.levels[c]) >= 2).length / ids.length) * 100);
            return (
              <li key={d.id} className="grid grid-cols-[minmax(7rem,11rem)_1fr_3rem] items-center gap-3">
                <span className="truncate text-sm font-semibold">{d.shortTitle}</span>
                <ProgressBar value={v} label={tr("{skill} mastery", { skill: d.title })} />
                <span className="text-right font-mono text-sm text-muted">{v}%</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Brilliant-style review: questions you tried but haven't got right yet. One tap jumps straight to the screen. */
function ReviewDeck({ me }: { me: Me }) {
  const cards: { lessonId: string; blockId: string; title: string; prompt: string; attempts: number }[] = [];
  for (const [lessonId, p] of Object.entries(me.progress)) {
    const lesson = lessonFor(lessonId);
    if (!lesson) continue;
    const blocks = lesson.sections.flatMap((s) => s.blocks);
    for (const [blockId, raw] of Object.entries(p.blockState ?? {})) {
      const e = raw as { correct?: boolean; attempts?: number; result?: { locked?: boolean } };
      if (e?.correct !== false || e.result?.locked) continue;
      const b = blocks.find((x) => x.id === blockId);
      if (!b || !("prompt" in b)) continue;
      cards.push({ lessonId, blockId, title: lesson.title, prompt: String(b.prompt).replace(/[*_`#]/g, ""), attempts: e.attempts ?? 1 });
    }
  }
  if (!cards.length) return null;
  return (
    <section aria-labelledby="rev-h">
      <h2 id="rev-h" className="flex items-center gap-2 font-display text-2xl font-bold"><RotateCcw className="size-6 text-accent" aria-hidden /> {tr("Review")}</h2>
      <p className="mb-3 text-sm text-muted">{trn(cards.length, "{n} question to come back to. Each one you fix earns XP.", "{n} questions to come back to. Each one you fix earns XP.")}</p>
      <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
        {cards.slice(0, 8).map((c) => (
          <li key={c.lessonId + c.blockId} className="w-64 shrink-0 snap-start">
            <a href={`#/lesson/${c.lessonId}/${c.blockId}`} className="flex h-full flex-col rounded-2xl border-2 border-border bg-surface p-4 hover:border-primary">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">{c.title}</span>
              <span className="mt-1 line-clamp-3 flex-1 font-semibold">{c.prompt}</span>
              <span className="mt-3 text-sm font-bold text-primary">{tr("Try again →")}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const PRINT_LABEL: Record<string, { label: string; tone: "neutral" | "primary" | "accent" | "success" | "danger" }> = {
  queued: { label: "In the print queue", tone: "primary" },
  redo: { label: "Changes needed", tone: "danger" },
  printing: { label: "Printing now", tone: "accent" },
  printed: { label: "Printed — ready to pick up", tone: "success" },
  failed: { label: "Print failed", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function MyPrints({ me, apiUrl, onChange }: { me: Me; apiUrl: string; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const prints = me.prints ?? [];
  const asked = new Set(prints.filter((p) => p.status !== "cancelled" && p.status !== "failed").map((p) => p.evidenceId));
  const stls = me.evidence.filter((e) => e.type === "stl" && !asked.has(e.id));
  if (!prints.length && !stls.length) return null;
  return (
    <section aria-labelledby="pr-h" className="rounded-3xl border border-border bg-surface p-6">
      <h2 id="pr-h" className="flex items-center gap-2 font-display text-2xl font-bold"><Printer className="size-6 text-primary" aria-hidden /> {tr("My prints")}</h2>
      {prints.length > 0 && (
        <ul className="mt-3 space-y-2">
          {prints.map((p) => {
            const st = PRINT_LABEL[p.status] ?? PRINT_LABEL.requested;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
                <span className="font-semibold">{p.fileName ?? tr("Print")}</span>
                <span className="text-sm text-muted">{lessonFor(p.lessonId)?.title}</span>
                <span className="ml-auto"><Pill tone={st.tone}>{tr(st.label)}</Pill></span>
                {p.teacherNote && <p className="w-full text-sm">{tr("Teacher:")} {p.teacherNote}</p>}
                {p.status === "redo" && <p className="w-full rounded-lg bg-danger-soft p-2 text-sm">{tr("Fix your design, upload the corrected STL in the mission, then request a print again. The corrected file will replace this one in the queue.")}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {stls.length > 0 && (
        <>
          <p className="mt-4 text-sm text-muted">{tr("STL files you uploaded that haven't been sent to the printer:")}</p>
          <ul className="mt-2 space-y-2">
            {stls.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border p-3">
                <span className="font-semibold">{e.fileName}</span>
                <span className="text-sm text-muted">{lessonFor(e.lessonId)?.title}</span>
                <Button size="sm" className="ml-auto" disabled={busy === e.id} onClick={async () => {
                  setBusy(e.id);
                  const r = await call(apiUrl, "requestPrint", { evidenceId: e.id });
                  setBusy(null);
                  setMsg(r.ok ? tr("Sent to your teacher's print queue.") : r.error);
                  if (r.ok) onChange();
                }}>{busy === e.id ? tr("Sending…") : tr("Request a print")}</Button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p role="status" className="mt-2 text-sm">{msg}</p>
    </section>
  );
}

