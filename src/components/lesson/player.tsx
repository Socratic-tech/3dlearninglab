"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { Award, CircleCheck, Lock, Volume2, VolumeX } from "lucide-react";
import type { Lesson, LessonBlock, ModelAsset } from "@/content/schema";
import type { BlockEntry } from "./types";
import { readOnlyApi, defaultLinks, type LessonApi, type LessonLinks } from "./api";
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
  /** "steps" = one focused screen at a time (students); "scroll" = whole lesson (teacher preview) */
  mode?: "steps" | "scroll";
  api?: LessonApi;
  links?: LessonLinks;
};

export function LessonPlayer(p: PlayerProps) {
  const api = p.api ?? readOnlyApi;
  const links = p.links ?? defaultLinks;
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
  const steps = useMemo(() => buildSteps(p.lesson), [p.lesson]);
  const [step, setStep] = useState(() => {
    // A fresh mission always starts at the hook. Resume only after the student has actually done something:
    // go to the first screen that still has required work, but never skip past the screen they last worked on.
    if (p.completed || doneIds.size === 0) return 0;
    let last = -1;
    steps.forEach((st, i) => { if (st.blocks.some((b) => doneIds.has(b.id))) last = i; });
    const firstOpen = steps.findIndex((st) => st.blocks.some((b) => p.requiredBlockIds.includes(b.id) && !doneIds.has(b.id)));
    return Math.max(0, firstOpen >= 0 ? Math.min(firstOpen, last + 1) : last);
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    setStep(Math.max(0, Math.min(n, steps.length + (p.readOnly ? -1 : 0))));
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const finish = (
    <section aria-label="Finish this mission" className="rounded-3xl border border-border bg-surface p-6 text-center sm:p-10">
      {completed ? (
        <div className="animate-unlock">
          <CircleCheck className="mx-auto size-16 text-success" aria-hidden />
          <p className="mt-3 font-display text-3xl font-bold">Mission complete!</p>
          <p className="mx-auto mt-2 max-w-md text-muted">Your skill levels grow when your teacher reviews your work. You can come back and improve any time.</p>
          {result?.unlocked.length ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 font-semibold text-accent">
              <Award className="size-5" aria-hidden /> {result.unlocked.length} new mission{result.unlocked.length > 1 ? "s" : ""} unlocked
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {result?.nextLessonId && <ButtonLink href={links.lesson(result.nextLessonId)} size="lg">Next mission</ButtonLink>}
            <ButtonLink href={links.missions} variant="secondary" size="lg">All missions</ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <p className="font-display text-2xl font-bold">{remaining.length ? "Almost there" : "Ready to finish?"}</p>
          {remaining.length > 0 ? (
            <>
              <p className="mt-1 text-muted">Still to do:</p>
              <ul className="mx-auto mt-3 max-w-sm space-y-2 text-left">
                {remaining.map((id) => {
                  const idx = steps.findIndex((st) => st.blocks.some((b) => b.id === id));
                  const b = steps[idx]?.blocks.find((x) => x.id === id);
                  return (
                    <li key={id}>
                      <button onClick={() => go(idx)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left font-semibold hover:border-primary">
                        <Lock className="size-4 text-muted" aria-hidden /> {b ? blockLabel(b) : id} <span className="ml-auto text-sm text-primary">Go</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-muted">You did every required activity.</p>
          )}
          <Button size="lg" className="mt-6" disabled={pending || remaining.length > 0} onClick={() => start(async () => {
            const r = await api.completeLesson({ courseId: p.courseId, lessonId: p.lesson.id });
            if (r.ok) { setCompleted(true); setResult(r.data); setError(null); } else setError(r);
          })}>
            {pending ? "Saving…" : "Complete mission"}
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
        <div className="space-y-10">
          {p.lesson.sections.map((s, i) => (
            <section key={i} className="space-y-4">
              <h2 className="flex items-baseline gap-3 font-display text-xl font-bold">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">{PHASE_LABEL[s.phase]}</span>
                {s.title}
              </h2>
              {s.blocks.map((b) => <div key={b.id}>{render(b)}</div>)}
            </section>
          ))}
        </div>
      </I.LessonCtx.Provider>
    );
  }

  const total = steps.length + (p.readOnly ? 0 : 1);
  const onFinish = step >= steps.length;
  const cur = steps[Math.min(step, steps.length - 1)];
  const curPhase = onFinish ? p.lesson.sections.length : cur.section;
  const openRequired = !onFinish && cur.blocks.some((b) => p.requiredBlockIds.includes(b.id) && !doneIds.has(b.id));

  return (
    <I.LessonCtx.Provider value={ctx}>
      <div className="mx-auto max-w-3xl">
        {/* Phase strip: you are here */}
        <ol className="mb-3 grid grid-cols-5 gap-1" aria-label="Mission phases">
          {p.lesson.sections.map((s, i) => {
            const first = steps.findIndex((st) => st.section === i);
            const state = i < curPhase ? "done" : i === curPhase ? "now" : "next";
            return (
              <li key={i}>
                <button onClick={() => first >= 0 && go(first)} aria-current={state === "now" ? "step" : undefined}
                  className={cn("w-full rounded-lg px-1 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider sm:text-xs",
                    state === "now" ? "bg-primary text-primary-fg" : state === "done" ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted")}>
                  {state === "done" && <span aria-hidden className="hidden sm:inline">✓ </span>}{PHASE_LABEL[s.phase]}{state === "done" && <span className="sr-only"> (done)</span>}
                </button>
              </li>
            );
          })}
        </ol>
        {/* Step progress */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="Mission progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <span className="font-mono text-xs text-muted">{step + 1}/{total}</span>
        </div>

        <div key={step} ref={stepRef} className="animate-fade-up space-y-4">
          {onFinish ? (
            finish
          ) : (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-sm font-bold uppercase tracking-widest text-accent outline-none">
                {p.lesson.sections[cur.section].title}
              </h2>
              {cur.blocks.map((b) => <div key={b.id}>{render(b)}</div>)}
            </>
          )}
        </div>

        {/* Big, thumb-friendly navigation */}
        <div className="sticky bottom-20 z-10 mt-8 flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
          <Button variant="secondary" size="lg" disabled={step === 0} onClick={() => go(step - 1)} aria-label="Previous step">← Back</Button>
          <ReadAloud key={step} target={stepRef} />
          <span className="flex-1 text-center text-sm text-muted" aria-live="polite">
            {openRequired ? "Try this one, or skip and come back." : ""}
          </span>
          {step < total - 1 && (
            <Button size="lg" variant={openRequired ? "secondary" : "primary"} onClick={() => go(step + 1)}>
              {openRequired ? "Skip for now" : "Next →"}
            </Button>
          )}
        </div>
        <p className="mt-3 text-center text-sm"><Link href={links.missions} className="text-muted underline">Back to missions</Link></p>
      </div>
    </I.LessonCtx.Provider>
  );
}

/**
 * UDL: hear the current screen read aloud (browser text-to-speech, nothing leaves the device).
 * Reads the visible text of the screen, including choices, and stops when the student moves on.
 */
const noSubscribe = () => () => {};
function ReadAloud({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = useSyncExternalStore(noSubscribe, () => "speechSynthesis" in window, () => false);
  // remounted on every screen change (key), so leaving a screen stops the voice
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  if (!supported) return null;
  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
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
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };
  return (
    <Button variant="ghost" size="lg" onClick={toggle} aria-pressed={speaking} aria-label={speaking ? "Stop reading aloud" : "Read this screen aloud"}>
      {speaking ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      <span className="hidden sm:inline">{speaking ? "Stop" : "Read aloud"}</span>
    </Button>
  );
}

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
    case "uploadEvidence": return "Submit your design";
    case "reflection": return "Reflect";
    default: return b.type;
  }
}
