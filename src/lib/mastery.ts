import type { Proficiency } from "@/content/schema";

/**
 * Proficiency math (spec §23). Pure functions — unit tested in tests/unit/mastery.test.ts.
 *
 * Rules
 * - Proficiency is stored separately from lesson completion.
 * - `computedLevel` is the BEST level supported by evidence since the last teacher override (or ever).
 *   Best-level-wins means an early failed attempt never lowers mastery.
 * - A teacher override sets a floor and resets the evidence window: effective = max(override, computedSinceOverride).
 *   So a teacher can lower a level (e.g. a lucky guess), and new evidence can still raise it again later.
 * - Automated checks: a correct *skill* check on an auto-assessable (conceptual) competency → Proficient;
 *   on a CAD/performance competency → Developing (needs human-verified evidence for Proficient).
 *   Practice items and incorrect answers → Developing ("attempted").
 * - Independent always requires teacher-rated evidence (rating 3) or a teacher override.
 */
export const LEVELS: Proficiency[] = ["not_attempted", "developing", "proficient", "independent"];
export const rank = (l: Proficiency | null | undefined) => (l ? LEVELS.indexOf(l) : 0);
export const maxLevel = (a: Proficiency | null | undefined, b: Proficiency | null | undefined): Proficiency =>
  rank(a) >= rank(b) ? (a ?? "not_attempted") : (b ?? "not_attempted");

export const LEVEL_LABEL: Record<Proficiency, string> = {
  not_attempted: "Not yet attempted",
  developing: "Developing",
  proficient: "Proficient",
  independent: "Independent",
};
/** Short glyphs so level is never shown by colour alone (heatmap). */
export const LEVEL_GLYPH: Record<Proficiency, string> = {
  not_attempted: "·",
  developing: "I",
  proficient: "II",
  independent: "III",
};

export function levelFromRating(rating: number): Proficiency {
  if (rating >= 3) return "independent";
  if (rating === 2) return "proficient";
  if (rating === 1) return "developing";
  return "not_attempted";
}

export function autoLevel(opts: { correct: boolean; check: "practice" | "skill"; autoAssessable: boolean }): Proficiency {
  if (opts.check === "skill" && opts.correct) return opts.autoAssessable ? "proficient" : "developing";
  return "developing";
}

export type CompetencyRow = {
  computedLevel: Proficiency;
  overrideLevel: Proficiency | null;
};

export function effectiveLevel(row: CompetencyRow | undefined | null): Proficiency {
  if (!row) return "not_attempted";
  return maxLevel(row.overrideLevel, row.computedLevel);
}

/** New computed level after a piece of evidence at `level`. */
export function applyEvidence(row: CompetencyRow | undefined | null, level: Proficiency): CompetencyRow {
  return {
    computedLevel: maxLevel(row?.computedLevel, level),
    overrideLevel: row?.overrideLevel ?? null,
  };
}

/** Teacher override: sets the level and resets the evidence window. */
export function applyOverride(level: Proficiency): CompetencyRow {
  return { computedLevel: "not_attempted", overrideLevel: level };
}

export function meetsLevel(level: Proficiency, min: "proficient" | "independent") {
  return rank(level) >= rank(min);
}

/** Designer level: grows with demonstrated mastery, used sparingly (spec §3). */
export function designerLevel(levels: Proficiency[]): number {
  const points = levels.reduce((s, l) => s + rank(l), 0);
  return 1 + Math.floor(points / 6);
}

export function domainProgress(levels: Proficiency[]): number {
  if (!levels.length) return 0;
  const proficient = levels.filter((l) => rank(l) >= 2).length;
  return Math.round((proficient / levels.length) * 100);
}

/** Mean level of a heatmap group, rounded down (0–3). */
export function groupLevel(levels: Proficiency[]): Proficiency {
  if (!levels.length) return "not_attempted";
  const attempted = levels.filter((l) => l !== "not_attempted");
  if (!attempted.length) return "not_attempted";
  const mean = levels.reduce((s, l) => s + rank(l), 0) / levels.length;
  return LEVELS[Math.max(1, Math.floor(mean))];
}
