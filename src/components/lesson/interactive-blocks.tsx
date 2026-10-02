"use client";

import { tr } from "@/lib/i18n";
import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CircleCheck, FlaskConical, Upload } from "lucide-react";
import type { BlockOf, ModelAsset } from "@/content/schema";
import type { BlockResponse } from "@/lib/scoring";
import { scoreBlock, toClientResult } from "@/lib/scoring";
import { getLocale } from "@/lib/i18n";
import type { LessonBlock } from "@/content/schema";
import type { ClientResult } from "@/lib/scoring";
import type { BlockEntry } from "./types";
import type { LessonApi } from "./api";
import { Button } from "@/components/ui/button";
import { FriendlyError } from "@/components/ui/friendly-error";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Pill } from "@/components/ui/card";
import LazyModelViewer from "@/components/viewer/LazyModelViewer";
import { BlockFrame, Md, Visual } from "./static-blocks";
import { Diagram } from "@/components/diagrams";
import { cn } from "@/lib/cn";
import { SliderScene, readout } from "./slider-scenes";

export type LessonCtxValue = {
  courseId: string;
  lessonId: string;
  entries: Record<string, BlockEntry>;
  markDone: (blockId: string, entry?: Partial<BlockEntry>) => void;
  assets: Record<string, ModelAsset>;
  readOnly: boolean;
  api: LessonApi;
  /** Step mode: question blocks hand their Check button + result to the player's bottom bar (Brilliant-style). */
  registerCheck?: (blockId: string, state: CheckState | null) => void;
  /** Practice questions that can be scored instantly in the browser (see lib/answer-pack.ts). */
  packs?: Record<string, LessonBlock>;
  /** Called when a background save of an instant answer is refused by the server. */
  onSaveError?: (message: string) => void;
};
export type CheckState = {
  label: string;
  ready: boolean;
  pending: boolean;
  run: () => void;
  result?: ClientResult;
  error?: { error: string; details?: string } | null;
};
export const LessonCtx = createContext<LessonCtxValue | null>(null);
const useLesson = () => useContext(LessonCtx)!;

/** Shared submit-and-show-result logic for scored blocks. */
function useAnswer(blockId: string) {
  const ctx = useLesson();
  const [result, setResult] = useState<ClientResult | undefined>(ctx.entries[blockId]?.result);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [pending, start] = useTransition();
  const submit = (response: BlockResponse) => {
    // Practice questions: score right here (same code as the server), save in the background.
    const full = ctx.packs?.[blockId];
    if (full && !ctx.readOnly) {
      const attempts = (ctx.entries[blockId]?.attempts ?? 0) + 1;
      let local: ClientResult | null = null;
      try {
        local = toClientResult(full, scoreBlock(full, response, getLocale()), attempts);
      } catch {
        local = null;
      }
      if (local) {
        setError(null);
        setResult(local);
        const entry = { result: local, response, attempts, correct: local.correct ?? undefined };
        ctx.markDone(blockId, entry);
        void ctx.api.answerBlock({ courseId: ctx.courseId, lessonId: ctx.lessonId, blockId, response, local: { ...entry, done: true } }).then((r) => {
          if (!r.ok) ctx.onSaveError?.(r.error);
        });
        return;
      }
    }
    // Skill checks (and anything we can't score locally): Google scores it.
    start(async () => {
      setError(null);
      const r = await ctx.api.answerBlock({ courseId: ctx.courseId, lessonId: ctx.lessonId, blockId, response });
      if (r.ok) {
        setResult(r.data);
        ctx.markDone(blockId, { result: r.data, response, attempts: r.data.attempts });
      } else setError(r);
    });
  };
  return { result, error, pending, submit, locked: !!result?.locked || ctx.readOnly, prev: ctx.entries[blockId]?.response as BlockResponse | undefined };
}

/**
 * The Check button. In step mode it lives in the player's bottom bar (always in the same place, like Brilliant);
 * in the teacher's scroll preview it renders inline.
 */
function CheckButton({ blockId, label, ready, pending, run, result, error, locked }: Omit<CheckState, "run"> & { blockId: string; run: () => void; locked: boolean }) {
  const ctx = useLesson();
  const reg = ctx.registerCheck;
  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; });
  useEffect(() => {
    reg?.(blockId, { label, ready, pending, result, error, run: () => runRef.current() });
  }, [reg, blockId, label, ready, pending, result, error]);
  useEffect(() => () => reg?.(blockId, null), [reg, blockId]);
  if (reg || locked) return null;
  return (
    <Button size="lg" className="mt-5" disabled={!ready || pending} onClick={run}>
      {pending ? tr("Checking…") : tr(label)}
    </Button>
  );
}

function InlineError({ error }: { error: { error: string; details?: string } | null }) {
  const ctx = useLesson();
  if (!error || ctx.registerCheck) return null;
  return <div className="mt-3"><FriendlyError {...error} /></div>;
}

function ResultPanel({ result }: { result?: ClientResult }) {
  const ctx = useLesson();
  if (!result || ctx.registerCheck) return null;
  const good = result.correct === true;
  const tone = good ? "border-success bg-success-soft" : result.correct === false ? "border-warning bg-warning-soft" : "border-primary bg-primary-soft";
  return (
    <div role="status" aria-live="polite" className={cn("mt-4 animate-unlock rounded-2xl border-2 p-5", tone)}>
      <p className="flex items-center gap-3 font-display text-xl font-bold">
        {good ? <CircleCheck className="size-8 shrink-0 text-success" aria-hidden /> : <FlaskConical className="size-8 shrink-0" aria-hidden />}
        {result.headline}
      </p>
      {result.feedback && <p className="mt-2">{result.feedback}</p>}
      {result.explanation && <Md text={result.explanation} className="mt-2" />}
      {result.correct === false && !result.locked && <p className="mt-3 font-semibold">{tr("What would you change? Try again ↑")}</p>}
    </div>
  );
}

function Header({ label, prompt, check }: { label: string; prompt: string; check?: "practice" | "skill" }) {
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">{tr(label)}</p>
        {check === "skill" && <Pill tone="accent">{tr("Skill check")}</Pill>}
      </div>
      <Md text={prompt} className="font-display text-xl font-bold sm:text-2xl" />
    </>
  );
}

// ───────── Prediction & multiple choice ─────────

export function PredictionBlock({ b }: { b: BlockOf<"prediction"> }) {
  const { result, error, pending, submit, locked, prev } = useAnswer(b.id);
  const [choice, setChoice] = useState<string>(prev?.type === "prediction" ? prev.optionId : "");
  const ctx = useLesson();
  return (
    <BlockFrame tone="check">
      <Header label="Predict" prompt={b.prompt} />
      {b.visual && <div className="my-3"><Visual {...b.visual} assets={ctx.assets} /></div>}
      <OptionList name={b.id} options={b.options} multiple={false} value={choice ? [choice] : []} onChange={(v) => setChoice(v[0])} disabled={locked} />
      <CheckButton blockId={b.id} label="Lock in" ready={!!choice} pending={pending} run={() => choice && submit({ type: "prediction", optionId: choice })} result={result} error={error} locked={locked} />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

function OptionList({ name, options, multiple, value, onChange, disabled, correctIds }: { name: string; options: BlockOf<"multipleChoice">["options"]; multiple: boolean; value: string[]; onChange: (v: string[]) => void; disabled: boolean; correctIds?: string[] }) {
  return (
    <fieldset className="mt-3 grid gap-2 sm:grid-cols-2" disabled={disabled}>
      <legend className="sr-only">{tr("Options")}</legend>
      {options.map((o) => {
        const checked = value.includes(o.id);
        const correct = correctIds?.includes(o.id);
        return (
          <label
            key={o.id}
            className={cn(
              "flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-base font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
              checked ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-2",
              correct && "border-success bg-success-soft",
              disabled && "cursor-default",
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              className="mt-0.5 size-5 accent-[var(--primary)]"
              checked={checked}
              onChange={(e) => onChange(multiple ? (e.target.checked ? [...value, o.id] : value.filter((x) => x !== o.id)) : [o.id])}
            />
            <span className="flex-1">
              {o.diagram && <Diagram name={o.diagram} className="mb-2" />}
              {o.text}
              {correct && <span className="sr-only"> {tr("(correct)")}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export function MultipleChoiceBlock({ b }: { b: BlockOf<"multipleChoice"> }) {
  const { result, error, pending, submit, locked, prev } = useAnswer(b.id);
  const ctx = useLesson();
  const multiple = b.correctOptionIds.length > 1;
  const [value, setValue] = useState<string[]>(prev?.type === "multipleChoice" ? prev.optionIds : []);
  return (
    <BlockFrame tone="check">
      <Header label={b.check === "skill" ? "Check your skill" : "Quick check"} prompt={b.prompt} check={b.check} />
      {multiple && <p className="text-sm text-muted">Choose {b.correctOptionIds.length}.</p>}
      {b.visual && <div className="my-3"><Visual {...b.visual} assets={ctx.assets} /></div>}
      <OptionList name={b.id} options={b.options} multiple={multiple} value={value} onChange={setValue} disabled={locked} correctIds={(result?.reveal.correctOptionIds as string[]) ?? undefined} />
      <CheckButton blockId={b.id} label="Check" ready={value.length > 0} pending={pending} run={() => value.length && submit({ type: "multipleChoice", optionIds: value })} result={result} error={error} locked={locked} />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

// ───────── Ordering & matching ─────────

export function OrderingBlock({ b }: { b: BlockOf<"ordering"> }) {
  const { result, error, pending, submit, locked, prev } = useAnswer(b.id);
  const initial = prev?.type === "ordering" ? prev.order.map((id) => b.items.find((i) => i.id === id)!).filter(Boolean) : b.items;
  const [items, setItems] = useState(initial);
  const [announce, setAnnounce] = useState("");
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setAnnounce(`${next[j].text} moved to position ${j + 1}`);
  };
  return (
    <BlockFrame tone="check">
      <Header label="Put in order" prompt={b.prompt} check={b.check} />
      <ol className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 p-2 pl-3">
            <span className="w-6 font-mono text-sm text-muted">{i + 1}</span>
            <span className="flex-1">{it.text}</span>
            {!locked && (
              <span className="flex gap-1">
                <button className="rounded-md p-1.5 hover:bg-surface-2 disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move “${it.text}” up`}>
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button className="rounded-md p-1.5 hover:bg-surface-2 disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move “${it.text}” down`}>
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{announce}</p>
      <CheckButton blockId={b.id} label="Check" ready pending={pending} run={() => submit({ type: "ordering", order: items.map((i) => i.id) })} result={result} error={error} locked={locked} />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

export function MatchingBlock({ b }: { b: BlockOf<"matching"> }) {
  const { result, error, pending, submit, locked, prev } = useAnswer(b.id);
  // redacted pairs carry the shuffled right side as "<pairId>::<text>"
  const rights = b.pairs.map((p) => {
    const [id, ...rest] = p.right.split("::");
    return { id, text: rest.join("::") || p.right };
  });
  const [pairs, setPairs] = useState<Record<string, string>>(prev?.type === "matching" ? prev.pairs : {});
  const good = new Set((result?.reveal.correctPairIds as string[]) ?? []);
  return (
    <BlockFrame tone="check">
      <Header label="Match" prompt={b.prompt} check={b.check} />
      <div className="mt-3 space-y-2">
        {b.pairs.map((p) => (
          <div key={p.id} className={cn("grid gap-2 rounded-xl border p-3 sm:grid-cols-2 sm:items-center", good.has(p.id) ? "border-success bg-success-soft" : "border-border")}>
            <label htmlFor={`${b.id}-${p.id}`} className="font-semibold">
              {p.left}
            </label>
            <Select id={`${b.id}-${p.id}`} value={pairs[p.id] ?? ""} disabled={locked} onChange={(e) => setPairs({ ...pairs, [p.id]: e.target.value })}>
              <option value="">{tr("Choose…")}</option>
              {rights.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.text}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <CheckButton blockId={b.id} label="Check" ready={b.pairs.every((p) => pairs[p.id])} pending={pending} run={() => submit({ type: "matching", pairs })} result={result} error={error} locked={locked} />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

// ───────── Hotspot & measurement ─────────

export function HotspotBlock({ b }: { b: BlockOf<"hotspot"> }) {
  const ctx = useLesson();
  const { result, error, pending, submit, locked } = useAnswer(b.id);
  const [point, setPoint] = useState<[number, number, number] | null>(null);
  const a = ctx.assets[b.modelId];
  const revealed = (result?.reveal.revealedIds as string[]) ?? [];
  return (
    <BlockFrame tone="check">
      <Header label="Find the problem" prompt={b.prompt} check={b.check} />
      {a?.localFilePath && (
        <div className="mt-3">
          <LazyModelViewer
            src={a.localFilePath}
            format={a.format}
            title={a.title}
            height={360}
            hotspots={b.hotspots.map((h) => ({ id: h.id, label: h.label, position: h.position, radius: h.radius }))}
            revealedHotspotIds={revealed}
            onPick={locked ? undefined : (p) => setPoint(p)}
            pickedPoint={point}
          />
        </div>
      )}
      {!locked && (
        <>
          <p className="mt-2 text-sm text-muted">{tr("Click the part of the model you suspect, then test it. Can't use a mouse? Choose a region:")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {b.hotspots.map((h) => (
              <button key={h.id} className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-surface-2" onClick={() => setPoint(h.position)} aria-pressed={point === h.position}>
                {h.label}
              </button>
            ))}
          </div>
        </>
      )}
      <CheckButton blockId={b.id} label="Check this spot" ready={!!point} pending={pending} run={() => point && submit({ type: "hotspot", point })} result={result} error={error} locked={locked} />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

export function MeasurementBlock({ b }: { b: BlockOf<"measurement"> }) {
  const ctx = useLesson();
  const { result, error, pending, submit, locked, prev } = useAnswer(b.id);
  const [v, setV] = useState(prev?.type === "measurement" ? String(prev.value) : "");
  const n = Number(v.replace(",", "."));
  return (
    <BlockFrame tone="check">
      <Header label="Measure" prompt={b.prompt} check={b.check} />
      {b.visual && <div className="my-3"><Visual {...b.visual} assets={ctx.assets} /></div>}
      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (v && Number.isFinite(n)) submit({ type: "measurement", value: n });
        }}
      >
        <Field label={tr("Your answer")} htmlFor={`${b.id}-v`}>
          <div className="flex items-center gap-2">
            <Input id={`${b.id}-v`} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} disabled={locked} className="w-32 font-mono" />
            <span className="font-mono text-muted">{b.unit}</span>
          </div>
        </Field>
        {!locked && !ctx.registerCheck && <Button disabled={!v || !Number.isFinite(n) || pending}>{pending ? tr("Checking…") : tr("Check")}</Button>}
      </form>
      <CheckButton blockId={b.id} label="Check" ready={!!v && Number.isFinite(n)} pending={pending} run={() => v && Number.isFinite(n) && submit({ type: "measurement", value: n })} result={result} error={error} locked />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

// ───────── Slider (hands-on exploration) ─────────

export function SliderBlock({ b }: { b: BlockOf<"slider"> }) {
  const { result, error, pending, submit, locked, prev } = useAnswer(b.id);
  const [v, setV] = useState(prev?.type === "slider" ? prev.value : b.start);
  const [moved, setMoved] = useState(prev?.type === "slider");
  const decimals = (String(b.step).split(".")[1] ?? "").length;
  const set = (x: number) => {
    const snapped = Math.round((Math.min(b.max, Math.max(b.min, x)) - b.min) / b.step) * b.step + b.min;
    setV(Number(snapped.toFixed(decimals)));
    setMoved(true);
  };
  const text = readout(b.scene, v);
  return (
    <BlockFrame tone="check">
      <Header label="Try it" prompt={b.prompt} check={b.check} />
      <div className="mt-4">
        <SliderScene scene={b.scene} value={v} />
      </div>
      <p className="mt-3 text-center font-mono text-lg font-semibold" aria-hidden>{text}</p>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-border text-2xl font-bold hover:border-primary disabled:opacity-40" onClick={() => set(v - b.step)} disabled={locked || v <= b.min} aria-label={`Less (${b.step} ${b.unit})`}>−</button>
        <input
          type="range"
          className="h-3 w-full cursor-pointer accent-[var(--primary)]"
          min={b.min}
          max={b.max}
          step={b.step}
          value={v}
          disabled={locked}
          onChange={(e) => set(Number(e.target.value))}
          aria-label={b.prompt.replace(/[*_`]/g, "")}
          aria-valuetext={text}
        />
        <button type="button" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-border text-2xl font-bold hover:border-primary disabled:opacity-40" onClick={() => set(v + b.step)} disabled={locked || v >= b.max} aria-label={`More (${b.step} ${b.unit})`}>+</button>
      </div>
      {!moved && !locked && <p className="mt-2 text-center text-sm text-muted">{tr("Drag the slider (or tap − / +) and watch what changes.")}</p>}
      <CheckButton blockId={b.id} label="Check" ready={moved} pending={pending} run={() => submit({ type: "slider", value: v })} result={result} error={error} locked={locked} />
      <InlineError error={error} />
      <ResultPanel result={result} />
    </BlockFrame>
  );
}

// ───────── Reflection (autosave) ─────────

export function ReflectionBlock({ b }: { b: BlockOf<"reflection"> }) {
  const ctx = useLesson();
  const entry = ctx.entries[b.id];
  const saved = entry?.response as { draft?: string; text?: string } | undefined;
  const [text, setText] = useState(saved?.text ?? saved?.draft ?? "");
  const [status, setStatus] = useState<string>(saved?.text ? "Submitted" : saved?.draft ? "Draft saved" : "");
  const [submitted, setSubmitted] = useState(Boolean(saved?.text));
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const onChange = (t: string) => {
    setText(t);
    setStatus("Saving…");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await ctx.api.saveDraft({ courseId: ctx.courseId, lessonId: ctx.lessonId, blockId: b.id, text: t });
      setStatus(r.ok ? "Draft saved" : "Couldn't save — keep this tab open and we'll retry");
    }, 1200);
  };
  return (
    <BlockFrame label={tr("Reflect")}>
      <label htmlFor={`${b.id}-t`} className="block text-lg font-semibold">
        {b.prompt}
      </label>
      {b.sentenceStarters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {b.sentenceStarters.map((s) => (
            <button key={s} type="button" disabled={ctx.readOnly} className="rounded-full border border-border px-3 py-1 text-sm hover:bg-surface-2" onClick={() => onChange(text ? `${text} ${s}` : s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <Textarea id={`${b.id}-t`} className="mt-3 min-h-32" value={text} onChange={(e) => onChange(e.target.value)} disabled={ctx.readOnly} />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted" aria-live="polite">
          {tr("{n} / {min} words", { n: words, min: b.minWords })}{status && ` · ${tr(status)}`}
        </span>
        {!ctx.readOnly && (
          <Button
            size="sm"
            disabled={pending || words < b.minWords}
            onClick={() =>
              start(async () => {
                clearTimeout(timer.current);
                const r = await ctx.api.submitReflection({ courseId: ctx.courseId, lessonId: ctx.lessonId, blockId: b.id, text });
                if (r.ok) {
                  setSubmitted(true);
                  setStatus("Submitted");
                  setError(null);
                  ctx.markDone(b.id, { response: { text } });
                } else setError(r);
              })
            }
          >
            {submitted ? tr("Submit revision") : tr("Submit reflection")}
          </Button>
        )}
      </div>
      {error && <div className="mt-3"><FriendlyError {...error} /></div>}
    </BlockFrame>
  );
}

// ───────── Evidence upload ─────────

export type EvidenceSummary = { id: string; type: string; fileName: string | null; url: string | null; createdAt: string; status: string; teacherComment: string | null; teacherRating: number | null; blockId: string | null };

const KIND_LABEL = { screenshot: "Screenshot (PNG/JPG)", stl: "STL file", obj: "OBJ file", design_url: "Tinkercad design link", physical_test: "Physical test result" } as const;

export function UploadEvidenceBlock({ b, existing }: { b: BlockOf<"uploadEvidence">; existing: EvidenceSummary[] }) {
  const ctx = useLesson();
  const [kind, setKind] = useState<(typeof b.accepts)[number]>(b.accepts[0]);
  const [list, setList] = useState(existing);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [ok, setOk] = useState("");
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const needsFile = kind === "screenshot" || kind === "stl" || kind === "obj";
  return (
    <BlockFrame label={tr("Submit evidence")} icon={<Upload className="size-4" aria-hidden />} tone="check">
      <Md text={b.prompt} className="font-semibold" />
      {b.checklist.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {b.checklist.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden>☐</span> {c}
            </li>
          ))}
        </ul>
      )}
      {list.length > 0 && (
        <ul className="mt-4 space-y-2">
          {list.map((e) => (
            <li key={e.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={e.status === "reviewed" ? "success" : e.status === "needs_revision" ? "warning" : "neutral"}>
                  {e.status === "reviewed" ? tr("Reviewed") : e.status === "needs_revision" ? tr("Revision requested") : tr("Submitted")}
                </Pill>
                <span>{tr(KIND_LABEL[e.type as keyof typeof KIND_LABEL] ?? e.type)}</span>
                <span className="text-muted">{e.fileName ?? e.url}</span>
                <span className="ml-auto text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</span>
              </div>
              {e.teacherComment && <p className="mt-2 rounded-lg bg-surface-2 p-2">{tr("Teacher:")} {e.teacherComment}</p>}
            </li>
          ))}
        </ul>
      )}
      {!ctx.readOnly && (
        <form
          ref={formRef}
          className="mt-4 space-y-3"
          action={(fd) =>
            start(async () => {
              setError(null);
              setOk("");
              fd.set("courseId", ctx.courseId);
              fd.set("lessonId", ctx.lessonId);
              fd.set("blockId", b.id);
              fd.set("kind", kind);
              const r = await ctx.api.submitEvidence(fd);
              if (r.ok) {
                setList([{ ...r.data, status: "submitted", teacherComment: null, teacherRating: null, blockId: b.id }, ...list]);
                setOk(tr("Submitted! Your teacher will review it."));
                formRef.current?.reset();
                ctx.markDone(b.id);
              } else setError(r);
            })
          }
        >
          {b.accepts.length > 1 && (
            <fieldset>
              <legend className="text-sm font-semibold">{tr("What are you submitting?")}</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {b.accepts.map((k) => (
                  <label key={k} className={cn("cursor-pointer rounded-lg border px-3 py-1.5 text-sm", kind === k ? "border-primary bg-primary-soft" : "border-border")}>
                    <input type="radio" className="sr-only" name="kindPick" checked={kind === k} onChange={() => setKind(k)} />
                    {tr(KIND_LABEL[k])}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {kind === "design_url" && (
            <Field label={tr("Design link")} htmlFor={`${b.id}-url`} hint={tr("Share the design with your class in Tinkercad and paste the link. Don't make it public.")}>
              <Input id={`${b.id}-url`} name="url" type="url" required placeholder="https://www.tinkercad.com/things/…" />
            </Field>
          )}
          {(needsFile || kind === "physical_test") && (
            <Field label={kind === "physical_test" ? tr("Photo (optional)") : tr("File")} htmlFor={`${b.id}-file`}>
              <input id={`${b.id}-file`} name="file" type="file" required={needsFile} accept={kind === "stl" ? ".stl" : kind === "obj" ? ".obj" : "image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.heic,.heif"} className="text-sm" />
            </Field>
          )}
          <Field label={kind === "physical_test" ? tr("Test result — what happened?") : tr("Note for your teacher (optional)")} htmlFor={`${b.id}-note`}>
            <Textarea id={`${b.id}-note`} name="note" required={kind === "physical_test"} className="min-h-20" />
          </Field>
          {b.allowPrintRequest && kind === "stl" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requestPrint" className="size-4" /> {tr("Also send this to the class print queue")}
            </label>
          )}
          <Button disabled={pending}>{pending ? tr("Uploading…") : tr("Submit")}</Button>
          <p role="status" className="text-sm text-success">
            {ok}
          </p>
        </form>
      )}
      {error && <div className="mt-3"><FriendlyError {...error} /></div>}
    </BlockFrame>
  );
}

// ───────── Design journal ─────────

export function JournalBlock({ b, prompts, initial }: { b: BlockOf<"journal">; prompts: { id: string; title: string; prompt: string }[]; initial: Record<string, string> }) {
  return (
    <BlockFrame label={tr("Design journal")}>
      <p className="text-sm text-muted">{tr("Autosaves as you type. Everything here also appears in your Portfolio.")}</p>
      <div className="mt-3 space-y-4">
        {b.promptIds.map((id) => {
          const p = prompts.find((x) => x.id === id)!;
          return <JournalEntry key={id} projectKey={b.projectKey} prompt={p} initial={initial[id] ?? ""} />;
        })}
      </div>
    </BlockFrame>
  );
}

export function JournalEntry({ projectKey, prompt, initial, courseId: courseOverride, api: apiOverride }: { projectKey: string; prompt: { id: string; title: string; prompt: string }; initial: string; courseId?: string; api?: LessonApi }): ReactNode {
  const ctx = useContext(LessonCtx);
  const courseId = courseOverride ?? ctx?.courseId ?? "";
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div>
      <label htmlFor={`j-${projectKey}-${prompt.id}`} className="block font-display font-semibold uppercase tracking-wide">
        {prompt.title}
      </label>
      <p className="text-sm text-muted">{prompt.prompt}</p>
      <Textarea
        id={`j-${projectKey}-${prompt.id}`}
        className="mt-1"
        value={text}
        disabled={ctx?.readOnly}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          setStatus("Saving…");
          clearTimeout(timer.current);
          timer.current = setTimeout(async () => {
            const r = await (ctx?.api ?? apiOverride)!.saveJournal({ courseId, projectKey, promptId: prompt.id, text: t });
            setStatus(r.ok ? "Saved" : "Couldn't save — retrying when you type again");
          }, 1000);
        }}
      />
      <p className="text-xs text-muted" aria-live="polite">
        {tr(status)}
      </p>
    </div>
  );
}
