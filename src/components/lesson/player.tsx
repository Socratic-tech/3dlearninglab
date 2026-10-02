"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Award, CircleCheck, Lock } from "lucide-react";
import type { Lesson, LessonBlock, ModelAsset } from "@/content/schema";
import type { BlockEntry } from "@/server/services/progress";
import { completeLessonAction, heartbeatAction } from "@/app/actions/student";
import { Button, ButtonLink } from "@/components/ui/button";
import { FriendlyError } from "@/components/ui/friendly-error";
import { cn } from "@/lib/cn";
import * as S from "./static-blocks";
import * as I from "./interactive-blocks";

const PHASE_LABEL = { discover: "Discover", practice: "Practice", apply: "Apply", prove: "Prove", reflect: "Reflect" } as const;

export type PlayerProps = {
  courseId: string;
  lesson: Lesson;
  entries: Record<string, BlockEntry>;
  requiredBlockIds: string[];
  evidence: I.EvidenceSummary[];
  assets: Record<string, ModelAsset>;
  competencyTitles: Record<string, string>;
  journalPrompts: { id: string; title: string; prompt: string }[];
  journals: Record<string, Record<string, string>>;
  tinkercadClassUrl: string | null;
  startedAt: string | null;
  completed: boolean;
  nextLessonTitle?: string | null;
  readOnly?: boolean;
};

export function LessonPlayer(p: PlayerProps) {
  const [entries, setEntries] = useState(p.entries);
  const [completed, setCompleted] = useState(p.completed);
  const [result, setResult] = useState<{ nextLessonId: string | null; unlocked: string[] } | null>(null);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [pending, start] = useTransition();

  const doneIds = useMemo(
    () => new Set([...Object.entries(entries).filter(([, e]) => e?.done).map(([k]) => k), ...p.evidence.flatMap((ev) => (ev.blockId ? [ev.blockId] : []))]),
    [entries, p.evidence],
  );
  const remaining = p.requiredBlockIds.filter((id) => !doneIds.has(id));

  // approximate time on task: one ping per visible minute
  useEffect(() => {
    if (p.readOnly) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") heartbeatAction({ courseId: p.courseId, lessonId: p.lesson.id });
    }, 60_000);
    return () => clearInterval(t);
  }, [p.courseId, p.lesson.id, p.readOnly]);

  const ctx: I.LessonCtxValue = {
    courseId: p.courseId,
    lessonId: p.lesson.id,
    entries,
    assets: p.assets,
    readOnly: !!p.readOnly,
    markDone: (blockId, extra) => setEntries((e) => ({ ...e, [blockId]: { ...e[blockId], ...extra, done: true } })),
  };

  const render = (b: LessonBlock) => {
    switch (b.type) {
      case "hero": return <S.HeroBlock b={b} assets={p.assets} />;
      case "text": return <S.TextBlock b={b} />;
      case "callout": return <S.CalloutBlock b={b} />;
      case "diagram": return <S.DiagramBlock b={b} />;
      case "image": return <S.ImageBlock b={b} />;
      case "video": return <S.VideoBlock b={b} />;
      case "showMe": return <S.ShowMeBlock b={b} />;
      case "modelViewer": return <S.ModelViewerBlock b={b} assets={p.assets} />;
      case "tinkercadLaunch": return <S.TinkercadBlock b={b} classUrl={p.tinkercadClassUrl} />;
      case "modelDownload": return <S.ModelDownloadBlock b={b} assets={p.assets} />;
      case "challenge": return <S.ChallengeBlock b={b} assets={p.assets} startedAt={p.startedAt} skillTitle={(id) => p.competencyTitles[id] ?? id} />;
      case "teacherCheck": return <S.TeacherCheckBlock b={b} done={doneIds.has(b.id)} />;
      case "observe": return <S.ObserveBlock b={b} />;
      case "prediction": return <I.PredictionBlock b={b} />;
      case "multipleChoice": return <I.MultipleChoiceBlock b={b} />;
      case "ordering": return <I.OrderingBlock b={b} />;
      case "matching": return <I.MatchingBlock b={b} />;
      case "hotspot": return <I.HotspotBlock b={b} />;
      case "measurement": return <I.MeasurementBlock b={b} />;
      case "reflection": return <I.ReflectionBlock b={b} />;
      case "uploadEvidence": return <I.UploadEvidenceBlock b={b} existing={p.evidence.filter((e) => e.blockId === b.id)} />;
      case "journal": return <I.JournalBlock b={b} prompts={p.journalPrompts} initial={p.journals[b.projectKey] ?? {}} />;
    }
  };

  return (
    <I.LessonCtx.Provider value={ctx}>
      <div className="grid gap-8 lg:grid-cols-[1fr_14rem]">
        <div className="min-w-0 space-y-10">
          {p.lesson.sections.map((s, i) => (
            <section key={i} id={`phase-${i}`} aria-labelledby={`phase-h-${i}`} className="scroll-mt-20 space-y-4">
              <h2 id={`phase-h-${i}`} className="flex items-baseline gap-3 font-display text-xl font-bold">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">{PHASE_LABEL[s.phase]}</span>
                {s.title}
              </h2>
              {s.blocks.map((b) => (
                <div key={b.id} id={`block-${b.id}`} className="scroll-mt-20">
                  {render(b)}
                </div>
              ))}
            </section>
          ))}

          {!p.readOnly && (
            <section aria-label="Finish this mission" className="rounded-3xl border border-border bg-surface p-6 text-center">
              {completed ? (
                <div className="animate-unlock">
                  <CircleCheck className="mx-auto size-10 text-success" aria-hidden />
                  <p className="mt-2 font-display text-xl font-bold">Mission complete</p>
                  <p className="text-sm text-muted">Completing a mission isn&apos;t the same as mastering it — your skill levels grow as your teacher reviews your evidence. You can come back and improve any time.</p>
                  {result?.unlocked.length ? (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1 font-semibold text-accent">
                      <Award className="size-4" aria-hidden /> Unlocked: {result.unlocked.length} new mission{result.unlocked.length > 1 ? "s" : ""}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {result?.nextLessonId && <ButtonLink href={`/student/lessons/${result.nextLessonId}`}>Next mission</ButtonLink>}
                    <ButtonLink href="/student/missions" variant="secondary">
                      All missions
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-display text-lg font-bold">Ready to finish?</p>
                  <p className="text-sm text-muted" aria-live="polite">
                    {remaining.length ? `${remaining.length} required activit${remaining.length === 1 ? "y" : "ies"} still open.` : "Every required activity is done."}
                  </p>
                  <Button
                    size="lg"
                    className="mt-4"
                    disabled={pending || remaining.length > 0}
                    onClick={() =>
                      start(async () => {
                        const r = await completeLessonAction({ courseId: p.courseId, lessonId: p.lesson.id });
                        if (r.ok) {
                          setCompleted(true);
                          setResult(r.data);
                          setError(null);
                        } else setError(r);
                      })
                    }
                  >
                    {pending ? "Saving…" : "Complete mission"}
                  </Button>
                  {error && <div className="mt-3 text-left"><FriendlyError {...error} /></div>}
                </>
              )}
            </section>
          )}
        </div>

        <nav aria-label="Lesson sections" className="hidden lg:block">
          <div className="sticky top-20 space-y-1 text-sm">
            {p.lesson.sections.map((s, i) => (
              <a key={i} href={`#phase-${i}`} className="block rounded-lg px-3 py-1.5 hover:bg-surface-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-accent">{PHASE_LABEL[s.phase]}</span>
                <span className="block font-semibold">{s.title}</span>
              </a>
            ))}
            <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Required</p>
            <ul className="px-3">
              {p.requiredBlockIds.map((id) => (
                <li key={id}>
                  <a href={`#block-${id}`} className={cn("flex items-center gap-2 py-0.5", doneIds.has(id) ? "text-success" : "text-muted")}>
                    {doneIds.has(id) ? <CircleCheck className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
                    <span className="truncate">{id.replace(/-/g, " ")}</span>
                    <span className="sr-only">{doneIds.has(id) ? "done" : "to do"}</span>
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/student/missions" className="mt-4 block px-3 text-primary underline">
              Back to missions
            </Link>
          </div>
        </nav>
      </div>
    </I.LessonCtx.Provider>
  );
}
