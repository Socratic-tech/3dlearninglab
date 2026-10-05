/**
 * XP, streaks and the daily goal — derived from records we already keep (attempts, evidence, completions),
 * so nothing extra is stored and students can't inflate it from the browser. Pure functions, shared by the
 * Next.js edition and the Apps Script backend (bundled into Lib.js).
 */

/**
 * XP rules. Questions pay for getting it right, more for fewer tries: 15 on the first try, 10 on the second,
 * 5 on the third, nothing once the explanation has been revealed (no XP for clicking anything).
 * Predictions have no right answer, so making one earns 10.
 */
export const XP = { correctByTry: [15, 10, 5], predict: 10, work: 20, lesson: 50 } as const;
export const correctXp = (attempt: number) => XP.correctByTry[Math.max(1, attempt) - 1] ?? 0;
export const DAILY_GOAL = 50;

export type XpEvent =
  | { kind: "attempt"; at: string | Date; lessonId: string; blockId: string; correct: boolean | null; attempt?: number }
  | { kind: "work"; at: string | Date; lessonId: string; blockId: string } // reflection or evidence
  | { kind: "lesson"; at: string | Date; lessonId: string };

export type Stats = {
  xp: number;
  todayXp: number;
  goal: number;
  /** consecutive days with any XP, ending today (or yesterday, if today hasn't started yet) */
  streak: number;
  /** last 7 days, oldest first; today is last */
  week: { day: string; xp: number }[];
  byLesson: Record<string, number>;
};

/** Calendar day (YYYY-MM-DD) in a time zone. */
export function dayKey(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function shiftDay(day: string, by: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

/**
 * Running XP summary for one student. Kept in the Sheet's Summary tab and updated as events happen,
 * so the server never has to re-read every past answer.
 */
export type XpSummary = { xp: number; days: Record<string, number>; seen: string[]; byLesson: Record<string, number> };
export const emptySummary = (): XpSummary => ({ xp: 0, days: {}, seen: [], byLesson: {} });

/** Add events to a summary (idempotent: each first-try / first-correct / submission / lesson counts once). */
export function applyEvents(summary: XpSummary, events: XpEvent[], timeZone = "America/Detroit"): XpSummary {
  const out: XpSummary = { xp: summary.xp || 0, days: { ...(summary.days || {}) }, seen: [...(summary.seen || [])], byLesson: { ...(summary.byLesson || {}) } };
  const seen = new Set(out.seen);
  const tries = new Map<string, number>(); // attempt numbers for events that don't carry one
  const sorted = events
    .map((e) => ({ e, t: new Date(e.at).getTime() }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);
  for (const { e, t } of sorted) {
    let gain = 0;
    const mark = (k: string, pts: number) => { if (!seen.has(k)) { seen.add(k); gain += pts; } };
    if (e.kind === "attempt") {
      const key = `${e.lessonId}|${e.blockId}`;
      const n = e.attempt ?? (tries.get(key) ?? 0) + 1;
      tries.set(key, n);
      if (e.correct === null) mark(`a${key}`, XP.predict);
      else if (e.correct === true) mark(`c${key}`, correctXp(n));
    } else if (e.kind === "work") mark(`w${e.lessonId}|${e.blockId}`, XP.work);
    else mark(`l${e.lessonId}`, XP.lesson);
    if (!gain) continue;
    out.xp += gain;
    out.byLesson[e.lessonId] = (out.byLesson[e.lessonId] ?? 0) + gain;
    const day = dayKey(new Date(t), timeZone);
    out.days[day] = (out.days[day] ?? 0) + gain;
  }
  out.seen = [...seen];
  // keep the stored row small: a year of days is plenty for streaks and the week strip
  const keep = Object.keys(out.days).sort().slice(-370);
  out.days = Object.fromEntries(keep.map((d) => [d, out.days[d]]));
  return out;
}

/** What the student sees, from a summary. */
export function statsFromSummary(summary: XpSummary, opts: { now?: Date; timeZone?: string } = {}): Stats {
  const tz = opts.timeZone || "America/Detroit";
  const today = dayKey(opts.now ?? new Date(), tz);
  const days = summary.days || {};
  let streak = 0;
  let d = days[today] ? today : shiftDay(today, -1);
  while (days[d]) { streak++; d = shiftDay(d, -1); }
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return { day, xp: days[day] ?? 0 };
  });
  return { xp: summary.xp || 0, todayXp: days[today] ?? 0, goal: DAILY_GOAL, streak, week, byLesson: summary.byLesson || {} };
}

export function computeStats(events: XpEvent[], opts: { now?: Date; timeZone?: string } = {}): Stats {
  return statsFromSummary(applyEvents(emptySummary(), events, opts.timeZone), opts);
}

/** XP the browser can show right after an answer (mirrors computeStats). */
export function answerXp(attempts: number, correct: boolean | null, wasCorrectBefore: boolean): number {
  if (correct === null) return attempts === 1 ? XP.predict : 0;
  return correct === true && !wasCorrectBefore ? correctXp(attempts) : 0;
}
