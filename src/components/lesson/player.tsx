"use client";

import { tr, trn, getLocale } from "@/lib/i18n";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { Award, CircleCheck, Flame, FlaskConical, LifeBuoy, Lock, Sparkles, Volume2, VolumeX } from "lucide-react";
import { isScorable, type ClientResult } from "@/lib/scoring";
import { answerXp, type Stats } from "@/lib/streaks";
import type { Lesson, LessonBlock, ModelAsset } from "@/content/schema";
import { allBlocks as allBlocksOf } from "@/content/schema";
import type { BlockEntry } from "./types";
import { readOnlyApi, defaultLinks, type LessonApi, type LessonLinks } from "./api";
import { Button, ButtonLink } from "@/components/ui/button";
import { FriendlyError } from "@/components/ui/friendly-error";
import { cn } from "@/lib/cn";
import * as S from "./static-blocks";
import * as I from "./interactive-blocks";
import { Md } from "./static-blocks";
import { Celebration } from "@/components/student/celebration";
import { GLOSSARY } from "@/content/glossary";
import { decodePack } from "@/lib/answer-pack";
import { localizedFlavor } from "@/content/i18n/localize";

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
  /** "steps" = one focused screen at a time (students); "scroll" = whole lesson (teacher preview) */
  mode?: "steps" | "scroll";
  api?: LessonApi;
  links?: LessonLinks;
  /** Leave room for a phone bottom nav under the sticky bar (Next.js edition has one; Pages doesn't). */
  bottomNav?: boolean;
  /** Teacher preview: may move past questions without answering. */
  freeNav?: boolean;
  /** Open on the screen that holds this block (e.g. from the review deck). */
  focusBlockId?: string;
  /** "I can…" statements for this lesson's competencies (shown on the goal card) */
  goals?: string[];
  /** Titles of the lessons this one builds on */
  buildsOn?: string[];
  /** Mission-complete effect the student chose in the XP store */
  celebration?: string;
};

export function LessonPlayer(p: PlayerProps) {
  const api = p.api ?? readOnlyApi;
  const links = p.links ?? defaultLinks;
  const [entries, setEntries] = useState(p.entries);
  const [completed, setCompleted] = useState(p.completed);
  const [result, setResult] = useState<{ nextLessonId: string | null; unlocked: string[]; stats?: Stats } | null>(null);
  const [checks, setChecks] = useState<Record<string, I.CheckState>>({});
  const registerCheck = useCallback((id: string, st: I.CheckState | null) => {
    setChecks((c) => {
      if (st) return { ...c, [id]: st };
      if (!(id in c)) return c;
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, []);
  const [dismissed, setDismissed] = useState<ClientResult | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewedDirections, setViewedDirections] = useState<Set<string>>(() => new Set());
  const markDirectionsViewed = useCallback((id: string) => {
    setViewedDirections((current) => current.has(id) ? current : new Set(current).add(id));
  }, []);
  // practice questions that can be scored instantly (scrambled answer packs from the build)
  const packs = useMemo(() => {
    const out: Record<string, LessonBlock> = {};
    for (const s of p.lesson.sections) for (const b of s.blocks) { const full = decodePack(b); if (full) out[b.id] = full; }
    return out;
  }, [p.lesson]);
  const [why, setWhy] = useState(false);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [pending, start] = useTransition();

  const doneIds = useMemo(
    () => new Set([...Object.entries(entries).filter(([, e]) => e?.done).map(([k]) => k), ...p.evidence.flatMap((ev) => (ev.blockId ? [ev.blockId] : []))]),
    [entries, p.evidence],
  );
  // Test out: students who already know it answer only the skill checks. All right = practice questions are skipped
  // (uploads and reflections are still needed). The server applies the same rule when the mission is finished.
  const skillIds = useMemo(() => allBlocksOf(p.lesson).filter((b) => isScorable(b) && "check" in b && b.check === "skill").map((b) => b.id), [p.lesson]);
  const [testOut, setTestOut] = useState(false);
  const passedTestOut = skillIds.length > 0 && skillIds.every((id) => entries[id]?.correct === true || (entries[id]?.result as { correct?: boolean } | undefined)?.correct === true);
  const practiceIds = useMemo(() => new Set(allBlocksOf(p.lesson).filter((b) => isScorable(b) && !skillIds.includes(b.id)).map((b) => b.id)), [p.lesson, skillIds]);
  const gates = (b: LessonBlock) => isScorable(b) && !(testOut && practiceIds.has(b.id));
  const remaining = p.requiredBlockIds.filter((id) => !doneIds.has(id) && !(passedTestOut && practiceIds.has(id)));
  const steps = useMemo(() => buildSteps(p.lesson), [p.lesson]);
  // Brilliant-style: you can't jump past a question you haven't tried yet.
  const gate = (() => {
    const i = steps.findIndex((st) => st.blocks.some((b) => gates(b) && !doneIds.has(b.id)));
    return p.readOnly || p.freeNav ? steps.length : i < 0 ? steps.length : i;
  })();
  const [step, setStep] = useState(() => {
    // A fresh mission always starts at the hook. Resume only after the student has actually done something:
    // go to the first screen that still has required work, but never skip past the screen they last worked on.
    if (p.focusBlockId) {
      const f = steps.findIndex((st) => st.blocks.some((b) => b.id === p.focusBlockId));
      const attemptedFocus = doneIds.has(p.focusBlockId);
      if (f >= 0) return attemptedFocus ? f : Math.min(f, gate);
    }
    if (p.completed || doneIds.size === 0) return 0;
    let last = -1;
    steps.forEach((st, i) => { if (st.blocks.some((b) => doneIds.has(b.id))) last = i; });
    const firstOpen = steps.findIndex((st) => st.blocks.some((b) => p.requiredBlockIds.includes(b.id) && !doneIds.has(b.id)));
    return Math.max(0, Math.min(gate, firstOpen >= 0 ? Math.min(firstOpen, last + 1) : last));
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const phaseRef = useRef<HTMLOListElement>(null);
  // words students can tap for a meaning: this lesson's vocabulary first, then common technical words (English)
  const vocab = useMemo(() => {
    const own = p.lesson.vocabulary;
    const extra = getLocale() === "en" ? GLOSSARY.filter((g) => !own.some((v) => v.term.toLowerCase() === g.term.toLowerCase())) : [];
    return [...own, ...extra];
  }, [p.lesson.vocabulary]);
  const stepRef = useRef<HTMLDivElement>(null);
  // moving forward stops at the next question not tried yet (counted from where you are, so review links work)
  const nextGate = (from: number) => {
    if (p.readOnly || p.freeNav) return steps.length;
    const i = steps.findIndex((st, k) => k >= from && st.blocks.some((b) => gates(b) && !doneIds.has(b.id)));
    return i < 0 ? steps.length : i;
  };
  const go = (n: number) => {
    const target = n > step ? Math.min(n, nextGate(step)) : n;
    setStep(Math.max(0, Math.min(target, steps.length + (p.readOnly ? -1 : 0))));
    setWhy(false);
    // Short screens (most Chromebooks): start the new step at the top so its question isn't hidden under the bar.
    if (window.innerHeight < 900) requestAnimationFrame(() => phaseRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    else window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  // approximate time on task: one ping per visible minute
  useEffect(() => {
    if (p.readOnly) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") api.heartbeat({ courseId: p.courseId, lessonId: p.lesson.id });
    }, 60_000);
    return () => clearInterval(t);
  }, [p.courseId, p.lesson.id, p.readOnly, api]);

  const ctx: I.LessonCtxValue = {
    courseId: p.courseId,
    lessonId: p.lesson.id,
    entries,
    assets: p.assets,
    readOnly: !!p.readOnly,
    api,
    markDone: (blockId, extra) => setEntries((e) => ({ ...e, [blockId]: { ...e[blockId], ...extra, done: true } })),
    registerCheck: p.mode === "scroll" ? undefined : registerCheck,
    packs,
    onSaveError: (m) => setSaveError(m),
  };

  const flavor = localizedFlavor(p.lesson.id, getLocale());
  const render = (b: LessonBlock) => {
    switch (b.type) {
      case "hero": return <S.HeroBlock b={b} assets={p.assets} />;
      case "text": return <S.TextBlock b={b} />;
      case "callout": return <S.CalloutBlock b={b} />;
      case "diagram": return <S.DiagramBlock b={b} />;
      case "image": return <S.ImageBlock b={b} />;
      case "video": return <S.VideoBlock b={b} />;
      case "showMe": return <S.ShowMeBlock b={b} onViewed={() => markDirectionsViewed(b.id)} />;
      case "modelViewer": return <S.ModelViewerBlock b={b} assets={p.assets} />;
      case "tinkercadLaunch": return <S.TinkercadBlock b={b} classUrl={p.tinkercadClassUrl} />;
      case "modelDownload": return <S.ModelDownloadBlock b={b} assets={p.assets} />;
      case "challenge": return <S.ChallengeBlock b={b} assets={p.assets} startedAt={p.startedAt} skillTitle={(id) => p.competencyTitles[id] ?? id} classUrl={p.tinkercadClassUrl} client={flavor?.clients?.[b.id]} themes={flavor?.themes?.[b.id]} pickId={`${p.lesson.id}.${b.id}`} />;
      case "teacherCheck": return <S.TeacherCheckBlock b={b} done={doneIds.has(b.id)} />;
      case "observe": return <S.ObserveBlock b={b} />;
      case "failGallery": return <S.FailGalleryBlock b={b} />;
      case "prediction": return <I.PredictionBlock b={b} />;
      case "multipleChoice": return <I.MultipleChoiceBlock b={b} />;
      case "ordering": return <I.OrderingBlock b={b} />;
      case "matching": return <I.MatchingBlock b={b} />;
      case "hotspot": return <I.HotspotBlock b={b} />;
      case "measurement": return <I.MeasurementBlock b={b} />;
      case "slider": return <I.SliderBlock b={b} />;
      case "reflection": return <I.ReflectionBlock b={b} />;
      case "uploadEvidence": return <I.UploadEvidenceBlock b={b} existing={p.evidence.filter((e) => e.blockId === b.id)} />;
      case "journal": return <I.JournalBlock b={b} prompts={p.journalPrompts} initial={p.journals[b.projectKey] ?? {}} />;
    }
  };

  const finish = (
    <section aria-label={tr("Finish this mission")} className="rounded-3xl border border-border bg-surface p-6 text-center sm:p-10">
      {completed ? (
        <div className="relative animate-unlock">
          {result && <Celebration kind={p.celebration} />}
          <CircleCheck className="mx-auto size-16 text-success" aria-hidden />
          <p className="mt-3 font-display text-3xl font-bold">{tr("Mission complete!")}</p>
          {pending && !result?.stats && <p className="mt-4 animate-pulse text-sm text-muted">{tr("Adding up your XP…")}</p>}
          {result?.stats && (
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-accent bg-accent-soft p-4">
                <Sparkles className="mx-auto size-7 text-accent" aria-hidden />
                <p className="mt-1 font-display text-2xl font-bold">+{result.stats.byLesson[p.lesson.id] ?? 0} XP</p>
                <p className="text-sm text-muted">{tr("this mission")}</p>
              </div>
              <div className="rounded-2xl border-2 border-warning bg-warning-soft p-4">
                <Flame className="mx-auto size-7 text-warning" aria-hidden />
                <p className="mt-1 font-display text-2xl font-bold">{trn(result.stats.streak, "{n} day", "{n} days")}</p>
                <p className="text-sm text-muted">{tr("streak")}</p>
              </div>
            </div>
          )}
          <p className="mx-auto mt-2 max-w-md text-muted">{tr("Your skill levels grow when your teacher reviews your work. You can come back and improve any time.")}</p>
          {result?.unlocked.length ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 font-semibold text-accent">
              <Award className="size-5" aria-hidden /> {trn(result.unlocked.length, "{n} new mission unlocked", "{n} new missions unlocked")}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {result?.nextLessonId && <ButtonLink href={links.lesson(result.nextLessonId)} size="lg">{tr("Next mission")}</ButtonLink>}
            <ButtonLink href={links.missions} variant="secondary" size="lg">{tr("All missions")}</ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <p className="font-display text-2xl font-bold">{remaining.length ? tr("Almost there") : tr("Ready to finish?")}</p>
          {remaining.length > 0 ? (
            <>
              <p className="mt-1 text-muted">{tr("Still to do:")}</p>
              <ul className="mx-auto mt-3 max-w-sm space-y-2 text-left">
                {remaining.map((id) => {
                  const idx = steps.findIndex((st) => st.blocks.some((b) => b.id === id));
                  const b = steps[idx]?.blocks.find((x) => x.id === id);
                  return (
                    <li key={id}>
                      <button onClick={() => go(idx)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left font-semibold hover:border-primary">
                        <Lock className="size-4 text-muted" aria-hidden /> {b ? tr(blockLabel(b)) : id} <span className="ml-auto text-sm text-primary">{tr("Go")}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-muted">{tr("You did every required activity.")}</p>
          )}
          <Button size="lg" className="mt-6" disabled={pending || remaining.length > 0} onClick={() => {
            // celebrate right away; XP, streak and the next mission fill in when Google confirms
            setCompleted(true);
            setResult({ nextLessonId: null, unlocked: [] });
            setError(null);
            start(async () => {
              const r = await api.completeLesson({ courseId: p.courseId, lessonId: p.lesson.id });
              if (r.ok) setResult(r.data);
              else { setCompleted(false); setResult(null); setError(r); }
            });
          }}>
            {pending ? tr("Saving…") : tr("Complete mission")}
          </Button>
          {error && <div className="mt-3 text-left"><FriendlyError {...error} /></div>}
        </>
      )}
    </section>
  );

  // Teacher preview: everything on one page.
  if (p.mode === "scroll") {
    return (
      <I.LessonCtx.Provider value={ctx}>
      <S.VocabContext.Provider value={vocab}>
        <div className="space-y-10">
          {flavor && <S.RealWorldCard hook={flavor.hook} />}
          <S.GoalCard goals={p.goals ?? []} buildsOn={p.buildsOn ?? []} vocabulary={p.lesson.vocabulary} />
          {p.lesson.sections.map((s, i) => (
            <section key={i} className="space-y-4">
              <h2 className="flex items-baseline gap-3 font-display text-xl font-bold">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">{tr(PHASE_LABEL[s.phase])}</span>
                {s.title}
              </h2>
              {s.blocks.map((b) => <div key={b.id}>{render(b)}</div>)}
            </section>
          ))}
        </div>
            </S.VocabContext.Provider>
    </I.LessonCtx.Provider>
    );
  }

  const total = steps.length + (p.readOnly ? 0 : 1);
  const onFinish = step >= steps.length;
  const cur = steps[Math.min(step, steps.length - 1)];
  const curPhase = onFinish ? p.lesson.sections.length : cur.section;
  const checkBlock = onFinish ? undefined : cur.blocks.find(isScorable);
  const directionBlocks = onFinish ? [] : cur.blocks.filter((b): b is Extract<LessonBlock, { type: "showMe" }> => b.type === "showMe");
  const directionsReady = p.readOnly || p.freeNav || directionBlocks.every((b) => viewedDirections.has(b.id));
  const chk = checkBlock ? checks[checkBlock.id] : undefined;
  const attempted = !!checkBlock && doneIds.has(checkBlock.id);
  const shown = chk?.result ?? (checkBlock ? entries[checkBlock.id]?.result : undefined);
  const sheet = shown && shown !== dismissed ? shown : undefined;
  const sheetTone = sheet?.correct === true ? "border-success bg-success-soft" : sheet?.correct === false ? "border-warning bg-warning-soft" : "border-primary bg-primary-soft";
  // XP only for answers given just now (not when revisiting an old answer)
  const before = checkBlock ? p.entries[checkBlock.id] : undefined;
  const freshXp = sheet && checkBlock && sheet !== before?.result ? answerXp(sheet.attempts, sheet.correct, before?.result?.correct === true) : 0;
  // uploads and reflections can wait (they may need a print or Tinkercad time); questions can't
  const laterHint = !onFinish && !checkBlock && cur.blocks.some((b) => p.requiredBlockIds.includes(b.id) && !doneIds.has(b.id)) ? "You can come back to this one." : "";
  const directionHint = !directionsReady ? "View every step, or choose Read it, before continuing." : "";
  const startTestOut = () => {
    setTestOut(true);
    const first = steps.findIndex((st) => st.blocks.some((b) => skillIds.includes(b.id) && !doneIds.has(b.id)));
    setStep(first >= 0 ? first : step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  /** Scroll the first matching control on this screen into view (above the bottom bar) and focus it. */
  const showControl = (selector: string) => {
    const el = stepRef.current?.querySelector<HTMLElement>(selector);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  return (
    <I.LessonCtx.Provider value={ctx}>
      <S.VocabContext.Provider value={vocab}>
      <div className="mx-auto max-w-3xl">
        {/* Phase strip: you are here */}
        <ol ref={phaseRef} className="mb-2 grid scroll-mt-16 grid-cols-5 gap-1" aria-label={tr("Mission phases")}>
          {p.lesson.sections.map((s, i) => {
            const first = steps.findIndex((st) => st.section === i);
            const state = i < curPhase ? "done" : i === curPhase ? "now" : "next";
            return (
              <li key={i}>
                <button onClick={() => first >= 0 && go(first)} disabled={first > step && !directionsReady} aria-current={state === "now" ? "step" : undefined}
                  className={cn("w-full rounded-lg px-1 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider sm:text-xs",
                    state === "now" ? "bg-primary text-primary-fg" : state === "done" ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted")}>
                  {state === "done" && <span aria-hidden className="hidden sm:inline">✓ </span>}{tr(PHASE_LABEL[s.phase])}{state === "done" && <span className="sr-only"> {tr("(done)")}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        {/* Step progress */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={tr("Mission progress")} aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <span className="font-mono text-xs text-muted">{p.completed ? tr("Review {n}/{total}", { n: step + 1, total }) : `${step + 1}/${total}`}</span>
        </div>

        <div key={step} ref={stepRef} className="animate-fade-up space-y-4">
          {onFinish ? (
            finish
          ) : (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-sm font-bold uppercase tracking-widest text-accent outline-none">
                {p.lesson.sections[cur.section].title}
              </h2>
              {step === 0 && flavor && <S.RealWorldCard hook={flavor.hook} />}
              {step === 0 && <S.GoalCard goals={p.goals ?? []} buildsOn={p.buildsOn ?? []} vocabulary={p.lesson.vocabulary} />}
              {step === 0 && skillIds.length > 0 && !p.completed && !p.readOnly && !testOut && !passedTestOut && (
                <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-primary/50 p-4">
                  <p className="min-w-0 flex-1 text-sm">
                    <strong>{tr("Already know this?")}</strong> {trn(skillIds.length, "Test out: answer the skill check. Get it right and you can skip the practice questions.", "Test out: answer the {n} skill checks. Get them all right and you can skip the practice questions.")}
                  </p>
                  <Button size="sm" variant="secondary" onClick={startTestOut}>{tr("Test out")}</Button>
                </section>
              )}
              {testOut && !passedTestOut && (
                <p role="note" className="rounded-xl border border-primary/40 bg-primary-soft px-3 py-2 text-sm">
                  <strong>{tr("Test-out mode:")}</strong> {tr("only the skill checks are required. Miss one? The practice questions are still here to help.")}{" "}
                  <button className="font-semibold underline" onClick={() => setTestOut(false)}>{tr("Stop test-out")}</button>
                </p>
              )}
              {passedTestOut && !p.completed && practiceIds.size > 0 && remaining.length < p.requiredBlockIds.filter((id) => !doneIds.has(id)).length && (
                <p role="note" className="rounded-xl border border-success/50 bg-success-soft px-3 py-2 text-sm">
                  <strong>{tr("You tested out!")}</strong> {tr("Practice questions are optional now. Finish any uploads or reflections, then complete the mission.")}
                </p>
              )}
              {cur.blocks.map((b) => <div key={b.id}>{render(b)}</div>)}
            </>
          )}
        </div>

        {/* Bottom bar: Check → feedback → Continue (always in the same place) */}
        <div className={cn("lesson-actions sticky z-10 mt-8 lg:bottom-4", p.bottomNav === false ? "bottom-2" : "bottom-20")}>
          {sheet && (
            <div role="status" aria-live="polite" className={cn("animate-fade-up rounded-t-2xl border-2 border-b-0 p-4 sm:p-5", sheetTone)}>
              <div className="flex items-start gap-3">
                {sheet.correct === true ? <CircleCheck className="size-8 shrink-0 text-success" aria-hidden /> : <FlaskConical className="size-8 shrink-0" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-bold">{sheet.headline}</p>
                  {sheet.feedback && <p className="mt-1">{sheet.feedback}</p>}
                  {sheet.explanation && (why || sheet.correct === true ? <Md text={sheet.explanation} className="mt-2" /> : null)}
                </div>
                {freshXp > 0 && <span className="shrink-0 rounded-full bg-accent px-3 py-1 font-display text-sm font-bold text-primary-fg animate-unlock">+{freshXp} XP</span>}
              </div>
              {sheet.explanation && sheet.correct !== true && (
                <button className="mt-2 text-sm font-semibold underline" onClick={() => setWhy(!why)} aria-expanded={why}>{why ? tr("Hide why") : tr("Why?")}</button>
              )}
            </div>
          )}
          {saveError && (
            <p role="alert" className="mb-2 rounded-xl border border-danger/40 bg-danger-soft px-3 py-2 text-sm">
              {tr("One answer didn't save:")} {saveError} <button className="ml-2 underline" onClick={() => setSaveError(null)}>{tr("OK")}</button>
            </p>
          )}
          {!sheet && chk?.error && <div className="rounded-t-2xl border-2 border-b-0 border-danger bg-surface p-3"><FriendlyError {...chk.error} /></div>}
          <div className={cn("flex items-center gap-1.5 border border-border bg-surface/95 p-2 shadow-lg backdrop-blur sm:gap-3 sm:p-3", sheet || chk?.error ? "rounded-b-2xl" : "rounded-2xl")}>
            <Button variant="secondary" size="lg" className={cn("px-3 sm:px-5", sheet && "hidden sm:inline-flex")} disabled={step === 0} onClick={() => go(step - 1)} aria-label={tr("Previous step")}>←<span className="hidden sm:inline"> {tr("Back")}</span></Button>
            <ReadAloud key={step} target={stepRef} />
            <StuckHelp vocabulary={p.lesson.vocabulary} />
            <span className="min-w-0 flex-1 text-center text-xs text-muted sm:text-sm" aria-live="polite">
              {checkBlock && !attempted && !sheet ? (
                chk?.ready ? "" : <button className="font-semibold text-primary underline" onClick={() => showControl("input:not([type=hidden]), select, textarea, [role=radio], [role=slider]")}>↓ {tr("Answer below")}</button>
              ) : directionHint ? (
                <button className="font-semibold text-primary underline" onClick={() => showControl("[data-next-step]")}>↓ {tr("See every step")}</button>
              ) : tr(laterHint)}
            </span>
            {checkBlock && sheet && sheet.correct === false && !sheet.locked && (
              <Button variant="secondary" size="lg" onClick={() => { setDismissed(sheet); setWhy(false); }}>{tr("Try again")}</Button>
            )}
            {checkBlock && !sheet && p.freeNav && step < total - 1 && (
              <Button variant="ghost" size="lg" onClick={() => go(step + 1)}>{tr("Skip")}</Button>
            )}
            {checkBlock && !sheet ? (
              <Button size="lg" disabled={!chk?.ready || chk.pending} onClick={() => chk?.run()}>
                {chk?.pending ? tr("Checking…") : tr(chk?.label ?? "Check")}
              </Button>
            ) : step < total - 1 ? (
              <Button size="lg" variant={laterHint ? "secondary" : "primary"} disabled={!directionsReady || (!!checkBlock && !attempted && !p.freeNav && gates(checkBlock))} onClick={() => go(step + 1)}>
                {laterHint ? tr("Do it later") : tr("Continue →")}
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-center text-sm"><Link href={links.missions} className="text-muted underline">Back to missions</Link></p>
      </div>
          </S.VocabContext.Provider>
    </I.LessonCtx.Provider>
  );
}

/**
 * UDL 6.2 / 8.2 / 9.1: a calm "what to do when you're stuck" menu, with the lesson's words close at hand.
 * Everything here is a strategy the student can use on their own before asking for help.
 */
function StuckHelp({ vocabulary }: { vocabulary: { term: string; definition: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="lg" className="px-2 sm:px-4" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="stuck-help" aria-label={tr("Stuck? Ideas to try")}>
        <LifeBuoy className="size-5" aria-hidden /><span className="hidden sm:inline">{tr("Stuck?")}</span>
      </Button>
      {open && (
        <div id="stuck-help" role="dialog" aria-label={tr("Stuck? Ideas to try")} className="absolute bottom-full left-0 z-20 mb-2 max-h-[70vh] w-[min(22rem,85vw)] overflow-y-auto rounded-2xl border border-border bg-surface p-4 text-left shadow-xl">
          <p className="font-display text-lg font-bold">{tr("Stuck? That's part of designing.")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>{tr("Open “Need a hint?” under the question, if there is one.")}</li>
            <li>{tr("Press the speaker to hear the screen read aloud.")}</li>
            <li>{tr("Go back a step and look at the pictures or Show Me steps again.")}</li>
            <li>{tr("Say the problem out loud, or explain it to a partner for 2 minutes.")}</li>
            <li>{tr("Try something and see what happens — a wrong answer tells you something.")}</li>
            <li>{tr("Take a 1-minute break: stand up, stretch, breathe slowly. Then look again.")}</li>
            <li>{tr("Still stuck? Ask your teacher — say what you tried.")}</li>
          </ul>
          {vocabulary.length > 0 && (
            <>
              <p className="mt-3 text-sm font-semibold">{tr("Words in this mission")}</p>
              <dl className="mt-1 space-y-1 text-sm">
                {vocabulary.map((v) => (
                  <div key={v.term}><dt className="inline font-semibold">{v.term}:</dt> <dd className="inline text-muted">{v.definition}</dd></div>
                ))}
              </dl>
            </>
          )}
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setOpen(false)}>{tr("Close")}</Button>
        </div>
      )}
    </div>
  );
}

/**
 * UDL: hear the current screen read aloud (browser text-to-speech, nothing leaves the device).
 * Reads the visible text of the screen, including choices, and stops when the student moves on.
 */
const noSubscribe = () => () => {};
const AUTO_READ = "academy.autoRead";
/** Grades 4–5 classes: once a student taps Listen, every next screen is read aloud too (until they tap Stop). */
const youngerScreen = () => typeof document !== "undefined" && document.documentElement.dataset.audience === "younger";
function autoReadOn() {
  try { return sessionStorage.getItem(AUTO_READ) === "1"; } catch { return false; }
}
function setAutoRead(on: boolean) {
  try { sessionStorage.setItem(AUTO_READ, on ? "1" : "0"); } catch { /* this screen only */ }
}

function ReadAloud({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = useSyncExternalStore(noSubscribe, () => "speechSynthesis" in window, () => false);
  const younger = useSyncExternalStore(noSubscribe, youngerScreen, () => false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  // remounted on every screen change (key), so leaving a screen stops the voice
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  useEffect(() => {
    if (!younger || !autoReadOn()) return;
    const t = setTimeout(() => wrapRef.current?.querySelector("button")?.click(), 600);
    return () => clearTimeout(t);
  }, [younger]);
  if (!supported) return null;
  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); if (younger) setAutoRead(false); return; }
    if (younger) setAutoRead(true);
    const el = target.current;
    if (!el) return;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("svg, [aria-hidden='true'], button, input, select, textarea").forEach((n) => {
      // keep the words on choice buttons/labels, drop icons and form widgets
      if (n.tagName === "BUTTON" || n.tagName === "svg" || n.getAttribute("aria-hidden") === "true") n.remove();
      else n.replaceWith(document.createTextNode(" "));
    });
    const text = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = Number(localStorage.getItem("academy.readRate") ?? "0.95") || 0.95;
    u.lang = getLocale() === "es" ? "es-US" : "en-US";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };
  return (
    <span ref={wrapRef} className="contents">
    <Button variant={younger ? "secondary" : "ghost"} size="lg" className="px-2 sm:px-4" onClick={toggle} aria-pressed={speaking} aria-label={speaking ? tr("Stop reading aloud") : tr("Read this screen aloud")}>
      {speaking ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      <span className={younger ? "inline" : "hidden sm:inline"}>{speaking ? tr("Stop") : younger ? tr("Listen") : tr("Read aloud")}</span>
    </Button>
    </span>
  );
}

/** A short burst of confetti (skipped when reduce motion is on — the animation becomes instant). */

const LIGHT: LessonBlock["type"][] = ["text", "callout"];

/** Group blocks into focused screens: short text/callouts ride along with the activity that follows them. */
function buildSteps(lesson: Lesson) {
  const steps: { section: number; blocks: LessonBlock[] }[] = [];
  lesson.sections.forEach((s, si) => {
    let carry: LessonBlock[] = [];
    for (const b of s.blocks) {
      if (LIGHT.includes(b.type) && carry.length < 2) { carry.push(b); continue; }
      // files belong with the challenge that asks for them
      const prev = steps.at(-1);
      if (b.type === "modelDownload" && !carry.length && prev?.section === si && prev.blocks.at(-1)?.type === "challenge") { prev.blocks.push(b); continue; }
      steps.push({ section: si, blocks: [...carry, b] });
      carry = [];
    }
    if (carry.length) {
      const last = steps.at(-1);
      if (last && last.section === si) last.blocks.push(...carry);
      else steps.push({ section: si, blocks: carry });
    }
  });
  return steps;
}

function blockLabel(b: LessonBlock): string {
  switch (b.type) {
    case "prediction": return "Make a prediction";
    case "multipleChoice": return b.check === "skill" ? "Skill check" : "Quick check";
    case "ordering": return "Put the steps in order";
    case "matching": return "Match them up";
    case "hotspot": return "Find the problem";
    case "measurement": return "Measure it";
    case "slider": return "Try it";
    case "uploadEvidence": {
      if (b.id === "lab-evidence") return "Submit your load-test evidence";
      if (b.id === "record-results") return "Submit your Fit Lab results";
      const first = b.prompt.split(/[.!?]/)[0].trim();
      return first.length <= 64 ? first : "Submit your final mission work";
    }
    case "reflection": return "Reflect";
    default: return b.type;
  }
}
