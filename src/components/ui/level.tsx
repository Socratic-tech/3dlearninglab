import type { Proficiency } from "@/content/schema";
import { LEVEL_GLYPH, LEVEL_LABEL } from "@/lib/mastery";
import { cn } from "@/lib/cn";

const BG: Record<Proficiency, string> = {
  not_attempted: "bg-level-0 text-muted",
  developing: "bg-level-1 text-fg",
  proficient: "bg-level-2 text-fg",
  independent: "bg-level-3 text-fg",
};

/** Level shown with glyph + text, never colour alone (spec §33). */
export function LevelChip({ level, compact, className }: { level: Proficiency; compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold", BG[level], className)} title={LEVEL_LABEL[level]}>
      <span aria-hidden className="font-mono">{LEVEL_GLYPH[level]}</span>
      {compact ? <span className="sr-only">{LEVEL_LABEL[level]}</span> : LEVEL_LABEL[level]}
    </span>
  );
}

export function LevelCell({ level }: { level: Proficiency }) {
  return (
    <span className={cn("flex h-9 w-full min-w-11 items-center justify-center rounded-md font-mono text-sm font-bold", BG[level])}>
      <span aria-hidden>{LEVEL_GLYPH[level]}</span>
      <span className="sr-only">{LEVEL_LABEL[level]}</span>
    </span>
  );
}

export function LevelLegend() {
  return (
    <ul className="flex flex-wrap gap-2 text-xs" aria-label="Proficiency legend">
      {(["not_attempted", "developing", "proficient", "independent"] as Proficiency[]).map((l) => (
        <li key={l}>
          <LevelChip level={l} />
        </li>
      ))}
    </ul>
  );
}
