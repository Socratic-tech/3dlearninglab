/**
 * XP, streaks and the daily goal — derived from records we already keep (attempts, evidence, completions),
 * so nothing extra is stored and students can't inflate it from the browser. Pure functions, shared by the
 * Next.js edition and the Apps Script backend (bundled into Lib.js).
 */

export const XP = { firstTry: 10, firstCorrect: 5, work: 20, lesson: 50 } as const;
export const DAILY_GOAL = 50;

export type XpEvent =
  | { kind: "attempt"; at: string | Date; lessonId: string; blockId: string; correct: boolean | null }
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

export function computeStats(events: XpEvent[], opts: { now?: Date; timeZone?: string } = {}): Stats {
  const tz = opts.timeZone || "America/Detroit";
  const today = dayKey(opts.now ?? new Date(), tz);
  const perDay = new Map<string, number>();
  const byLesson: Record<string, number> = {};
  const seen = new Set<string>();
  let xp = 0;
  const sorted = events
    .map((e) => ({ e, t: new Date(e.at).getTime() }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);
  for (const { e, t } of sorted) {
    let gain = 0;
    if (e.kind === "attempt") {
      const k = `${e.lessonId}|${e.blockId}`;
      if (!seen.has("a" + k)) { seen.add("a" + k); gain += XP.firstTry; }
      if (e.correct === true && !seen.has("c" + k)) { seen.add("c" + k); gain += XP.firstCorrect; }
    } else if (e.kind === "work") {
      const k = `w${e.lessonId}|${e.blockId}`;
      if (!seen.has(k)) { seen.add(k); gain += XP.work; }
    } else {
      const k = `l${e.lessonId}`;
      if (!seen.has(k)) { seen.add(k); gain += XP.lesson; }
    }
    if (!gain) continue;
    xp += gain;
    byLesson[e.lessonId] = (byLesson[e.lessonId] ?? 0) + gain;
    const day = dayKey(new Date(t), tz);
    perDay.set(day, (perDay.get(day) ?? 0) + gain);
  }
  let streak = 0;
  let d = perDay.has(today) ? today : shiftDay(today, -1);
  while (perDay.has(d)) { streak++; d = shiftDay(d, -1); }
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return { day, xp: perDay.get(day) ?? 0 };
  });
  return { xp, todayXp: perDay.get(today) ?? 0, goal: DAILY_GOAL, streak, week, byLesson };
}

/** XP the browser can show right after an answer (mirrors computeStats). */
export function answerXp(attempts: number, correct: boolean | null, wasCorrectBefore: boolean): number {
  return (attempts === 1 ? XP.firstTry : 0) + (correct === true && !wasCorrectBefore ? XP.firstCorrect : 0);
}
