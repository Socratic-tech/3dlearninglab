"use client";

import { tr } from "@/lib/i18n";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { BookOpen, Download, ExternalLink, Eye, Globe2, Lightbulb, MessageCircle, Monitor, PencilRuler, PlayCircle, ShieldAlert, Swords, Timer, TriangleAlert, Users } from "lucide-react";
import type { Client, Hook, Theme } from "@/content/flavor";
import type { BlockOf, ModelAsset } from "@/content/schema";
import { Diagram } from "@/components/diagrams";
import LazyModelViewer from "@/components/viewer/LazyModelViewer";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Tiny, safe markdown: paragraphs, "- " lists, **bold**, `code`. No HTML is ever injected. */
export function Md({ text, className }: { text: string; className?: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
      part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>,
    );
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={cn("prose-lesson", className)}>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*] /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ""))}</li>)}</ul>;
        if (lines.every((l) => /^\s*\d+\. /.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+\. /, ""))}</li>)}</ol>;
        return <p key={i}>{inline(b.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

export function BlockFrame({ children, label, icon, tone = "default" }: { children: ReactNode; label?: string; icon?: ReactNode; tone?: "default" | "boss" | "check" }) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-surface p-5 sm:p-6",
        tone === "boss" ? "border-accent/60 bg-accent-soft/40" : tone === "check" ? "border-primary/40" : "border-border",
      )}
    >
      {label && (
        <p className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {icon}
          {label}
        </p>
      )}
      {children}
    </section>
  );
}

export function Visual({ diagram, modelId, assets, alt }: { diagram?: string; modelId?: string; assets: Record<string, ModelAsset>; alt?: string }) {
  if (diagram) return <Diagram name={diagram} title={alt} className="mx-auto max-h-64 max-w-md" />;
  const a = modelId ? assets[modelId] : undefined;
  if (a?.localFilePath) return <LazyModelViewer src={a.localFilePath} format={a.format} title={a.title} description={alt ?? a.educationalPurpose} height={300} />;
  return null;
}

export function HeroBlock({ b, assets }: { b: BlockOf<"hero">; assets: Record<string, ModelAsset> }) {
  return (
    <section className="bg-blueprint overflow-hidden rounded-3xl border border-border bg-surface">
      {b.visual && (
        <div className="border-b border-border bg-surface/70 p-4 [&_svg]:mx-auto [&_svg]:max-h-56 sm:p-6">
          <Visual {...b.visual} assets={assets} />
        </div>
      )}
      <div className="p-6 text-center sm:p-8">
        <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{b.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">{b.hook}</p>
      </div>
    </section>
  );
}

const words = (t: string) => t.trim().split(/\s+/).length;

/** Short by default: long explanations show their first sentence and hide the rest behind "Tell me more". */
export function TextBlock({ b }: { b: BlockOf<"text"> }) {
  const [open, setOpen] = useState(false);
  const long = words(b.body) > 30;
  const first = b.body.split(/(?<=[.!?])\s+/)[0];
  return (
    <section className="rounded-2xl border-l-4 border-primary bg-surface px-5 py-4 text-lg">
      {b.title && <h3 className="mb-1 font-display text-xl font-semibold">{b.title}</h3>}
      {long && !open ? <Md text={first} /> : <Md text={b.body} />}
      {long && (
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 text-sm font-semibold text-primary underline">
          {open ? tr("Show less") : tr("Tell me more")}
        </button>
      )}
    </section>
  );
}

export function CalloutBlock({ b }: { b: BlockOf<"callout"> }) {
  const tone = { tip: "border-primary/40 bg-primary-soft", warning: "border-warning/50 bg-warning-soft", safety: "border-danger/40 bg-danger-soft", idea: "border-accent/40 bg-accent-soft" }[b.tone];
  const Icon = { tip: Lightbulb, warning: TriangleAlert, safety: ShieldAlert, idea: Lightbulb }[b.tone];
  return (
    <aside className={cn("flex gap-3 rounded-2xl border p-4", tone)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        {b.title && <p className="font-semibold">{b.title}</p>}
        <Md text={b.body} className="text-sm" />
      </div>
    </aside>
  );
}

export function DiagramBlock({ b }: { b: BlockOf<"diagram"> }) {
  return (
    <figure className="rounded-2xl border border-border bg-surface p-4">
      <Diagram name={b.name} title={b.alt} className="mx-auto max-w-2xl" />
      <figcaption className="mt-2 text-center text-sm text-muted">{b.caption}</figcaption>
    </figure>
  );
}

export function ImageBlock({ b }: { b: BlockOf<"image"> }) {
  return (
    <figure className="rounded-2xl border border-border bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={b.src} alt={b.alt} className="mx-auto max-h-96 rounded-lg" />
      {b.caption && <figcaption className="mt-2 text-center text-sm text-muted">{b.caption}</figcaption>}
    </figure>
  );
}

export function VideoBlock({ b }: { b: BlockOf<"video"> }) {
  return (
    <BlockFrame label={tr("Watch")} icon={<PlayCircle className="size-4" aria-hidden />}>
      <video controls preload="metadata" className="w-full rounded-lg" src={b.url}>
        {b.captionsUrl && <track kind="captions" src={b.captionsUrl} srcLang="en" label="English" default />}
      </video>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold">{tr("Transcript")}</summary>
        <Md text={b.transcript} />
      </details>
    </BlockFrame>
  );
}

/** SHOW ME (step carousel) and READ IT (all steps as text) — spec §33. */
export function ShowMeBlock({ b }: { b: BlockOf<"showMe"> }) {
  const [mode, setMode] = useState<"show" | "read">("show");
  const [i, setI] = useState(0);
  const step = b.steps[i];
  return (
    <BlockFrame label={tr("Show me")} icon={<Eye className="size-4" aria-hidden />}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{b.title}</h3>
        <div role="group" aria-label={tr("How to view")} className="inline-flex rounded-lg border border-border p-0.5 text-sm">
          {(["show", "read"] as const).map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("rounded-md px-3 py-1 font-semibold", mode === m ? "bg-primary text-primary-fg" : "text-muted")}>
              {m === "show" ? tr("Show me") : tr("Read it")}
            </button>
          ))}
        </div>
      </div>
      {mode === "read" ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {b.steps.map((s, j) => (
            <li key={j}>
              {s.text} {s.keys && <kbd>{s.keys}</kbd>}
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4">
          {step.diagram && <Diagram name={step.diagram} className="mx-auto mb-3 max-w-lg" />}
          <p aria-live="polite" className="text-lg">
            <span className="mr-2 font-mono text-sm text-muted">
              {tr("Step {n} / {total}", { n: i + 1, total: b.steps.length })}
            </span>
            {step.text} {step.keys && <kbd>{step.keys}</kbd>}
          </p>
          <div className="mt-4 flex gap-2">
            <button className={buttonClass("secondary", "sm")} disabled={i === 0} onClick={() => setI(i - 1)}>
              {tr("Back")}
            </button>
            <button className={buttonClass("primary", "sm")} disabled={i === b.steps.length - 1} onClick={() => setI(i + 1)}>
              {tr("Next step")}
            </button>
          </div>
        </div>
      )}
    </BlockFrame>
  );
}

export function ModelViewerBlock({ b, assets }: { b: BlockOf<"modelViewer">; assets: Record<string, ModelAsset> }) {
  const a = assets[b.modelId];
  if (!a?.localFilePath) return null;
  return (
    <figure className="rounded-2xl border border-border bg-surface p-4">
      <LazyModelViewer src={a.localFilePath} format={a.format} title={a.title} description={b.caption} showLayers={b.showLayers} showDimensions={b.showDimensions ?? true} height={360} />
      <figcaption className="mt-2 text-sm text-muted">{b.caption}</figcaption>
    </figure>
  );
}

export const TINKERCAD_URL = "https://www.tinkercad.com/dashboard";

/** "Open Tinkercad" (and the class's Tinkercad Classroom, if the teacher set one). Always a new tab. */
export function TinkercadButtons({ classUrl }: { classUrl: string | null }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {classUrl && (
          <a href={classUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg")}>
            {tr("Open our Tinkercad Classroom")} <ExternalLink className="size-4" aria-hidden /><span className="sr-only"> {tr("(opens in a new tab)")}</span>
          </a>
        )}
        <a href={TINKERCAD_URL} target="_blank" rel="noopener noreferrer" className={buttonClass(classUrl ? "secondary" : "primary", "lg")}>
          {tr("Open Tinkercad")} <ExternalLink className="size-4" aria-hidden /><span className="sr-only"> {tr("(opens in a new tab)")}</span>
        </a>
      </div>
      <p className="mt-2 text-xs text-muted">{tr("Opens in a new tab. Come back to this tab when you're done.")}</p>
    </div>
  );
}

const WHERE = {
  tinkercad: { icon: Monitor, text: "Do this in Tinkercad", cls: "bg-primary-soft text-primary border-primary/40" },
  offline: { icon: PencilRuler, text: "Do this offline — paper, tools or real objects", cls: "bg-warning-soft text-warning border-warning/50" },
  both: { icon: PencilRuler, text: "Part offline, part in Tinkercad", cls: "bg-accent-soft text-accent border-accent/50" },
  teacher: { icon: Users, text: "In person, with your teacher", cls: "bg-success-soft text-success border-success/50" },
} as const;

/** Where a task happens, so nobody hunts for it in the wrong place. */
export function WhereTag({ where }: { where: keyof typeof WHERE }) {
  const w = WHERE[where];
  const Icon = w.icon;
  return (
    <p className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold", w.cls)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      {tr(w.text)}
    </p>
  );
}

export function TinkercadBlock({ b, classUrl }: { b: BlockOf<"tinkercadLaunch">; classUrl: string | null }) {
  return (
    <BlockFrame label={tr("Try it in Tinkercad")}>
      <WhereTag where="tinkercad" />
      <h3 className="font-display text-lg font-semibold">{b.title}</h3>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {b.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <div className="mt-4">
        <TinkercadButtons classUrl={classUrl} />
      </div>
    </BlockFrame>
  );
}

const LICENSE_LABEL: Record<string, string> = {
  "CC0-1.0": "CC0 (public domain)",
  "public-domain": "Public domain",
  "CC-BY-4.0": "CC BY 4.0",
  "CC-BY-SA-4.0": "CC BY-SA 4.0",
  "CC-BY-NC-4.0": "CC BY-NC 4.0",
  "other-permissive": "Permissive license",
};

export function ModelCard({ a, compact }: { a: ModelAsset; compact?: boolean }) {
  const [view, setView] = useState(false);
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface-2/40 p-4">
      <h4 className="font-display font-semibold">{a.title}</h4>
      {view && a.localFilePath && (
        <div className="mt-2">
          <LazyModelViewer src={a.localFilePath} format={a.format} title={a.title} height={260} />
        </div>
      )}
      {!compact && <p className="mt-1 text-sm">{a.educationalPurpose}</p>}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 text-xs text-muted">
        <dt>{tr("License")}</dt>
        <dd>{tr(LICENSE_LABEL[a.license] ?? a.license)}{!a.sourceVerifiedAt && tr(" (as listed — not yet verified)")}</dd>
        <dt>{tr("Creator")}</dt>
        <dd>{a.creator}</dd>
        {a.dimensionsMm && (
          <>
            <dt>{tr("Size")}</dt>
            <dd>{a.dimensionsMm.join(" × ")} mm</dd>
          </>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {a.localFilePath ? (
          <>
            <button className={buttonClass("secondary", "sm")} onClick={() => setView((v) => !v)} aria-expanded={view}>
              <Eye className="size-4" aria-hidden /> {view ? tr("Hide 3D") : tr("View in 3D")}
            </button>
            <a href={a.localFilePath} download={a.originalFileName} className={buttonClass("primary", "sm")}>
              <Download className="size-4" aria-hidden /> {tr("Download {format}", { format: a.format.toUpperCase() })}
            </a>
          </>
        ) : null}
        {a.sourcePage && (
          <a href={a.sourcePage} target="_blank" rel="noopener noreferrer" className={buttonClass(a.localFilePath ? "ghost" : "secondary", "sm")}>
            {a.localFilePath ? tr("Source") : tr("Get it from the source")} <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}

export function ModelDownloadBlock({ b, assets }: { b: BlockOf<"modelDownload">; assets: Record<string, ModelAsset> }) {
  const list = b.modelIds.map((id) => assets[id]).filter(Boolean);
  return (
    <BlockFrame label={tr("Files for this mission")} icon={<Download className="size-4" aria-hidden />}>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((a) => (
          <ModelCard key={a.id} a={a} />
        ))}
      </div>
      {b.showImportSteps && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">{tr("How to import a file into Tinkercad")}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>{tr("Download the STL file above.")}</li>
            <li>{tr("Open Tinkercad and start (or open) a design.")}</li>
            <li><Md text={tr("Choose **Import** (top right) and pick the file from your Downloads.")} /></li>
            <li>{tr("Keep units in millimetres and click Import. The model appears as one shape on the workplane.")}</li>
          </ol>
        </details>
      )}
    </BlockFrame>
  );
}

/** Elapsed time since this screen opened (for awareness only). */
function Elapsed() {
  const [since] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  const fmt = `${Math.floor(s / 3600) ? Math.floor(s / 3600) + "h " : ""}${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm" aria-label={tr("Time elapsed {time}", { time: fmt })}>
      <Timer className="size-4" aria-hidden /> {fmt}
    </span>
  );
}

/** Boss battles and Prove-It tasks get a "mission briefing" look with a tickable requirements checklist. */
/** Opening card: where this skill shows up in the real world. */
export function RealWorldCard({ hook }: { hook: Hook }) {
  return (
    <section className="rounded-3xl border-2 border-accent bg-accent-soft p-5 sm:p-6">
      <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
        <Globe2 className="size-4" aria-hidden /> {tr("In the real world")}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{hook.headline}</h2>
      <p className="mt-2 text-lg">{hook.body}</p>
    </section>
  );
}

/** UDL 8.1 / 6.1 / 3.1 / 2.1: what you'll be able to do, what it builds on, and the words you'll use. */
export function GoalCard({ goals, buildsOn, vocabulary }: { goals: string[]; buildsOn: string[]; vocabulary: { term: string; definition: string }[] }) {
  if (!goals.length && !buildsOn.length && !vocabulary.length) return null;
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6" aria-label={tr("Today's goals")}>
      <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
        <PencilRuler className="size-4" aria-hidden /> {tr("Today's goals")}
      </p>
      {goals.length > 0 && (
        <ul className="mt-2 space-y-1 text-lg font-semibold">
          {goals.map((g) => <li key={g}>✓ {g}</li>)}
        </ul>
      )}
      {buildsOn.length > 0 && <p className="mt-3 text-sm text-muted">{tr("Builds on:")} {buildsOn.join(" · ")}</p>}
      {vocabulary.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            <BookOpen className="mr-1 inline size-4" aria-hidden />
            {tr("Words you'll use ({n})", { n: vocabulary.length })}
          </summary>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {vocabulary.map((v) => (
              <div key={v.term} className="rounded-xl bg-surface-2 p-3">
                <dt className="font-semibold">{v.term}</dt>
                <dd className="text-sm text-muted">{v.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </section>
  );
}

/** A request from a (fictional) client, styled like a message. */
function ClientMessage({ c }: { c: Client }) {
  const initials = c.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="mb-4 flex items-start gap-3">
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-white">{initials}</span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm"><MessageCircle className="size-4" aria-hidden /><strong>{tr("New request from {name}", { name: c.name })}</strong><span className="opacity-75">· {c.who}</span></p>
        <p className="mt-1 rounded-2xl rounded-tl-sm bg-surface p-3 text-base text-fg">{c.message}</p>
      </div>
    </div>
  );
}

const themeKey = (id: string) => `academy.pick.${id}`;
/** Same skill, your choice of theme. Remembered on this device only. */
function ThemePicker({ id, themes }: { id: string; themes: Theme[] }) {
  const [pick, setPick] = useState<string | null>(() => {
    try { return localStorage.getItem(themeKey(id)); } catch { return null; }
  });
  const choose = (i: number) => {
    setPick(String(i));
    try { localStorage.setItem(themeKey(id), String(i)); } catch { /* private mode */ }
  };
  const chosen = pick !== null ? themes[Number(pick)] : undefined;
  return (
    <fieldset className="mt-5">
      <legend className="text-xs font-bold uppercase tracking-widest opacity-75">{tr("Make it yours · pick a theme")}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {themes.map((t, i) => (
          <button key={i} type="button" aria-pressed={pick === String(i)} onClick={() => choose(i)}
            className={cn("rounded-full border-2 px-4 py-1.5 text-sm font-bold", pick === String(i) ? "border-accent bg-accent text-white" : "border-current/30 hover:border-accent")}>
            {t.label}
          </button>
        ))}
      </div>
      {chosen && <p className="mt-2 text-base" aria-live="polite">{tr("Idea: {idea}. Same requirements — your style.", { idea: chosen.idea })}</p>}
    </fieldset>
  );
}

export function ChallengeBlock({ b, assets, skillTitle, classUrl = null, client, themes, pickId }: { b: BlockOf<"challenge">; assets: Record<string, ModelAsset>; startedAt?: string | null; skillTitle: (id: string) => string; classUrl?: string | null; client?: Client; themes?: Theme[]; pickId?: string }) {
  const [ticks, setTicks] = useState<boolean[]>(() => b.requirements.map(() => false));
  const briefing = b.kind !== "micro";
  const boss = b.kind === "boss";
  const done = ticks.filter(Boolean).length;
  return (
    <section className={cn("overflow-hidden rounded-3xl border", briefing ? "border-transparent bg-fg text-bg" : "border-primary/40 bg-surface")}>
      <div className={cn("flex flex-wrap items-center justify-between gap-2 px-5 py-3", briefing ? (boss ? "bg-accent text-white" : "bg-primary text-primary-fg") : "bg-primary-soft text-primary")}>
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em]">
          {boss ? <Swords className="size-4" aria-hidden /> : null}
          {boss ? tr("Boss battle") : b.kind === "prove" ? tr("Prove it · no steps this time") : tr("Micro challenge")}
        </p>
        {b.showTimer && <Elapsed />}
      </div>
      <div className="p-5 sm:p-6">
        {client && <ClientMessage c={client} />}
        <WhereTag where={b.where ?? "tinkercad"} />
        <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{b.title}</h3>
        <Md text={b.prompt} className={cn("mt-2 text-lg", briefing && "opacity-90")} />
        {b.visual && <div className="mt-3 rounded-xl bg-surface p-2"><Visual {...b.visual} assets={assets} /></div>}
        {themes && themes.length > 0 ? (
          <ThemePicker id={pickId ?? b.id} themes={themes} />
        ) : (
          <p className={cn("mt-4 rounded-xl p-3 text-sm", briefing ? "bg-white/10" : "bg-primary-soft")}>
            <strong>{tr("Make it yours:")}</strong> {tr("change the look, the name or who it's for — anything you like, as long as every requirement is met.")}
          </p>
        )}
        <p className="mt-5 text-xs font-bold uppercase tracking-widest opacity-75">{tr("Requirements · {done}/{total} checked", { done, total: b.requirements.length })}</p>
        <ul className="mt-2 space-y-2">
          {b.requirements.map((r, i) => (
            <li key={i}>
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-base font-semibold", briefing ? "border-white/20 hover:bg-white/10" : "border-border hover:bg-surface-2", ticks[i] && "opacity-70")}>
                <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={ticks[i]} onChange={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))} />
                <span className={cn(ticks[i] && "line-through")}>{r}</span>
              </label>
            </li>
          ))}
        </ul>
        {b.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5" aria-label={tr("Skills you'll use")}>
            <span className="text-xs font-bold uppercase tracking-widest opacity-75">{tr("Skills:")}</span>
            {b.skills.map((s) => (
              <span key={s} className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", briefing ? "bg-white/15" : "bg-primary-soft text-primary")}>✓ {skillTitle(s)}</span>
            ))}
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 text-sm opacity-90">
          <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {b.kind === "boss"
              ? tr("Talk your plan through with a partner if it helps — then build and submit your own.")
              : tr("Team option: plan with a partner and check each other's work against the requirements. Each of you builds and submits your own.")}
          </span>
        </p>
        {(b.where ?? "tinkercad") !== "offline" && (
          <div className="mt-5 rounded-2xl bg-surface p-4 text-fg">
            <TinkercadButtons classUrl={classUrl} />
          </div>
        )}
        {b.showTimer && <p className="mt-3 text-xs opacity-75">{tr("The timer is just for you — speed doesn't change your grade.")}</p>}
      </div>
    </section>
  );
}

export function TeacherCheckBlock({ b, done }: { b: BlockOf<"teacherCheck">; done: boolean }) {
  return (
    <BlockFrame label={tr("Teacher check")} icon={<BookOpen className="size-4" aria-hidden />}>
      <WhereTag where="teacher" />
      <p className="mt-2">{b.prompt}</p>
      <ul className="mt-2 list-disc pl-5 text-sm text-muted">
        {b.lookFors.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm font-semibold" role="status">
        {done ? tr("✓ Your teacher has checked this.") : tr("When you're ready, ask your teacher to check your work.")}
      </p>
    </BlockFrame>
  );
}

/** Fail gallery: one card at a time. Guess, then flip to see what went wrong and how to fix it. */
export function FailGalleryBlock({ b }: { b: BlockOf<"failGallery"> }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const c = b.cards[i];
  const open = !!shown[c.id];
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-danger/50 bg-surface" aria-roledescription="carousel" aria-label={b.title}>
      <div className="flex items-center justify-between bg-danger-soft px-5 py-3">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-danger">{b.title}</p>
        <p className="font-mono text-xs text-muted" aria-live="polite">{i + 1} / {b.cards.length}</p>
      </div>
      <div className="p-5 sm:p-6" aria-roledescription="slide" aria-label={tr("{n} of {total}: {name}", { n: i + 1, total: b.cards.length, name: c.nickname })}>
        <h3 className="font-display text-2xl font-bold">{c.nickname}</h3>
        <div className="mt-3 rounded-2xl bg-surface-2/60 p-2 [&_svg]:max-h-56"><Diagram name={c.diagram} /></div>
        <p className="mt-3 text-lg"><strong>{tr("Clue:")}</strong> {c.clue}</p>
        {open ? (
          <div className="mt-3 animate-fade-up space-y-2 rounded-2xl border-2 border-success bg-success-soft p-4">
            <p><strong>{tr("What went wrong:")}</strong> {c.cause}</p>
            <p><strong>{tr("The fix:")}</strong> {c.fix}</p>
          </div>
        ) : (
          <button className={buttonClass("primary", "lg", "mt-4")} onClick={() => setShown({ ...shown, [c.id]: true })}>{tr("Guess first… then reveal")}</button>
        )}
        <div className="mt-5 flex items-center justify-between gap-2">
          <button className={buttonClass("secondary")} disabled={i === 0} onClick={() => setI(i - 1)}>{tr("← Previous fail")}</button>
          <button className={buttonClass("secondary")} disabled={i === b.cards.length - 1} onClick={() => setI(i + 1)}>{tr("Next fail →")}</button>
        </div>
      </div>
    </section>
  );
}

export function ObserveBlock({ b }: { b: BlockOf<"observe"> }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <BlockFrame label={tr("Investigate")}>
      <h3 className="font-display text-lg font-semibold">{b.title}</h3>
      <p className="mt-1 text-sm text-muted">{tr("For each sample, answer:")} {b.questions.join(" · ")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {b.cards.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <p className="font-mono text-sm font-bold uppercase tracking-widest">{c.label}</p>
            {c.hint && <p className="mt-1 text-sm text-muted">{c.hint}</p>}
            {open[c.id] ? (
              <div className="mt-2 animate-fade-up">
                {c.diagram && <Diagram name={c.diagram} className="mb-2" />}
                <Md text={c.reveal} className="text-sm" />
              </div>
            ) : (
              <button className={cn(buttonClass("secondary", "sm"), "mt-3")} onClick={() => setOpen({ ...open, [c.id]: true })}>
                {tr("Reveal explanation")}
              </button>
            )}
          </div>
        ))}
      </div>
    </BlockFrame>
  );
}
