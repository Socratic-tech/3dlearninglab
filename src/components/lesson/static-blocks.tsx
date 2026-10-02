"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { BookOpen, Download, ExternalLink, Eye, Lightbulb, PlayCircle, ShieldAlert, Swords, Timer, TriangleAlert } from "lucide-react";
import type { BlockOf, ModelAsset } from "@/content/schema";
import { Diagram } from "@/components/diagrams";
import LazyModelViewer from "@/components/viewer/LazyModelViewer";
import { Pill } from "@/components/ui/card";
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
  if (diagram) return <Diagram name={diagram} title={alt} className="mx-auto max-w-xl" />;
  const a = modelId ? assets[modelId] : undefined;
  if (a?.localFilePath) return <LazyModelViewer src={a.localFilePath} format={a.format} title={a.title} description={alt ?? a.educationalPurpose} height={300} />;
  return null;
}

export function HeroBlock({ b, assets }: { b: BlockOf<"hero">; assets: Record<string, ModelAsset> }) {
  return (
    <section className="bg-blueprint grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 md:grid-cols-2 md:items-center">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{b.title}</h2>
        <p className="mt-2 text-lg text-muted">{b.hook}</p>
      </div>
      {b.visual && <Visual {...b.visual} assets={assets} />}
    </section>
  );
}

export function TextBlock({ b }: { b: BlockOf<"text"> }) {
  return (
    <BlockFrame>
      {b.title && <h3 className="mb-1 font-display text-lg font-semibold">{b.title}</h3>}
      <Md text={b.body} />
    </BlockFrame>
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
    <BlockFrame label="Watch" icon={<PlayCircle className="size-4" aria-hidden />}>
      <video controls preload="metadata" className="w-full rounded-lg" src={b.url}>
        {b.captionsUrl && <track kind="captions" src={b.captionsUrl} srcLang="en" label="English" default />}
      </video>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold">Transcript</summary>
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
    <BlockFrame label="Show me" icon={<Eye className="size-4" aria-hidden />}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{b.title}</h3>
        <div role="group" aria-label="How to view" className="inline-flex rounded-lg border border-border p-0.5 text-sm">
          {(["show", "read"] as const).map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("rounded-md px-3 py-1 font-semibold", mode === m ? "bg-primary text-primary-fg" : "text-muted")}>
              {m === "show" ? "Show me" : "Read it"}
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
              Step {i + 1} / {b.steps.length}
            </span>
            {step.text} {step.keys && <kbd>{step.keys}</kbd>}
          </p>
          <div className="mt-4 flex gap-2">
            <button className={buttonClass("secondary", "sm")} disabled={i === 0} onClick={() => setI(i - 1)}>
              Back
            </button>
            <button className={buttonClass("primary", "sm")} disabled={i === b.steps.length - 1} onClick={() => setI(i + 1)}>
              Next step
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

export function TinkercadBlock({ b, classUrl }: { b: BlockOf<"tinkercadLaunch">; classUrl: string | null }) {
  return (
    <BlockFrame label="Try it in Tinkercad">
      <h3 className="font-display text-lg font-semibold">{b.title}</h3>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {b.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        {classUrl && (
          <a href={classUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
            Open our Tinkercad Classroom <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
        <a href="https://www.tinkercad.com/dashboard" target="_blank" rel="noopener noreferrer" className={buttonClass(classUrl ? "secondary" : "primary")}>
          Open Tinkercad <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>
      <p className="mt-2 text-xs text-muted">Tinkercad opens in a new tab. Keep this tab open to come back.</p>
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
        <dt>License</dt>
        <dd>{LICENSE_LABEL[a.license] ?? a.license}{!a.sourceVerifiedAt && " (as listed — not yet verified)"}</dd>
        <dt>Creator</dt>
        <dd>{a.creator}</dd>
        {a.dimensionsMm && (
          <>
            <dt>Size</dt>
            <dd>{a.dimensionsMm.join(" × ")} mm</dd>
          </>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {a.localFilePath ? (
          <>
            <button className={buttonClass("secondary", "sm")} onClick={() => setView((v) => !v)} aria-expanded={view}>
              <Eye className="size-4" aria-hidden /> {view ? "Hide 3D" : "View in 3D"}
            </button>
            <a href={a.localFilePath} download={a.originalFileName} className={buttonClass("primary", "sm")}>
              <Download className="size-4" aria-hidden /> Download {a.format.toUpperCase()}
            </a>
          </>
        ) : null}
        {a.sourcePage && (
          <a href={a.sourcePage} target="_blank" rel="noopener noreferrer" className={buttonClass(a.localFilePath ? "ghost" : "secondary", "sm")}>
            {a.localFilePath ? "Source" : "Get it from the source"} <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}

export function ModelDownloadBlock({ b, assets }: { b: BlockOf<"modelDownload">; assets: Record<string, ModelAsset> }) {
  const list = b.modelIds.map((id) => assets[id]).filter(Boolean);
  return (
    <BlockFrame label="Files for this mission" icon={<Download className="size-4" aria-hidden />}>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((a) => (
          <ModelCard key={a.id} a={a} />
        ))}
      </div>
      {b.showImportSteps && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">How to import a file into Tinkercad</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Download the STL file above.</li>
            <li>Open Tinkercad and start (or open) a design.</li>
            <li>Choose <strong>Import</strong> (top right) and pick the file from your Downloads.</li>
            <li>Keep units in millimetres and click Import. The model appears as one shape on the workplane.</li>
          </ol>
        </details>
      )}
    </BlockFrame>
  );
}

function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  const fmt = `${Math.floor(s / 3600) ? Math.floor(s / 3600) + "h " : ""}${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm" aria-label={`Time elapsed ${fmt}`}>
      <Timer className="size-4" aria-hidden /> {fmt}
    </span>
  );
}

export function ChallengeBlock({ b, assets, startedAt, skillTitle }: { b: BlockOf<"challenge">; assets: Record<string, ModelAsset>; startedAt: string | null; skillTitle: (id: string) => string }) {
  const boss = b.kind === "boss";
  return (
    <BlockFrame tone={boss ? "boss" : "check"} label={boss ? "Boss battle" : b.kind === "prove" ? "Prove it" : "Micro challenge"} icon={boss ? <Swords className="size-4" aria-hidden /> : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-xl font-bold">{b.title}</h3>
        {b.showTimer && startedAt && (
          <div className="text-right">
            <Elapsed since={startedAt} />
            <p className="text-xs text-muted">For your awareness — speed doesn&apos;t affect your grade.</p>
          </div>
        )}
      </div>
      <Md text={b.prompt} />
      {b.visual && <Visual {...b.visual} assets={assets} />}
      <h4 className="mt-3 text-sm font-semibold">Requirements</h4>
      <ul className="mt-1 space-y-1">
        {b.requirements.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-primary">▸</span> {r}
          </li>
        ))}
      </ul>
      {b.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills used">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Skills detected:</span>
          {b.skills.map((s) => (
            <Pill key={s} tone="primary">
              ✓ {skillTitle(s)}
            </Pill>
          ))}
        </div>
      )}
      {(boss || b.kind === "prove") && <p className="mt-3 text-sm text-muted">No step-by-step directions here — decide which tools you need.</p>}
    </BlockFrame>
  );
}

export function TeacherCheckBlock({ b, done }: { b: BlockOf<"teacherCheck">; done: boolean }) {
  return (
    <BlockFrame label="Teacher check" icon={<BookOpen className="size-4" aria-hidden />}>
      <p>{b.prompt}</p>
      <ul className="mt-2 list-disc pl-5 text-sm text-muted">
        {b.lookFors.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm font-semibold" role="status">
        {done ? "✓ Your teacher has checked this." : "When you're ready, ask your teacher to check your work."}
      </p>
    </BlockFrame>
  );
}

export function ObserveBlock({ b }: { b: BlockOf<"observe"> }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <BlockFrame label="Investigate">
      <h3 className="font-display text-lg font-semibold">{b.title}</h3>
      <p className="mt-1 text-sm text-muted">For each sample, answer: {b.questions.join(" · ")}</p>
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
                Reveal explanation
              </button>
            )}
          </div>
        ))}
      </div>
    </BlockFrame>
  );
}
