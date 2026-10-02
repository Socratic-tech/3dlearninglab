import Link from "next/link";
import { Check, Flame, Lock, Play, Sparkles, Star, Swords, Target } from "lucide-react";
import type { Stats } from "@/lib/streaks";
import { cn } from "@/lib/cn";

export type PathItem = {
  id: string;
  title: string;
  kind: "lesson" | "boss" | string;
  state: "completed" | "in_progress" | "available" | "locked";
  href: string;
  week: number;
  weekTitle: string;
  due?: string | null;
};

/** Gentle zig-zag so the path reads like a trail, not a list. */
const OFFSETS = [0, 1, 2, 1, 0, -1, -2, -1];

/**
 * Brilliant-style course path: one big circle per mission, grouped into units, with the next mission
 * called out. Keyboard and screen-reader users get an ordered list of links with plain-language states.
 */
export function MissionPath({ items }: { items: PathItem[] }) {
  const current = items.find((x) => x.state === "in_progress") ?? items.find((x) => x.state === "available");
  const weeks = new Map<number, PathItem[]>();
  items.forEach((x) => weeks.set(x.week, [...(weeks.get(x.week) ?? []), x]));
  let n = 0;
  return (
    <ol className="mx-auto max-w-md space-y-10" aria-label="Mission path">
      {[...weeks.entries()].map(([week, list]) => {
        const done = list.filter((x) => x.state === "completed").length;
        return (
          <li key={week}>
            <div className={cn("rounded-2xl px-5 py-3 text-center", done === list.length ? "bg-success-soft" : "bg-primary-soft")}>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Unit {week}</p>
              <h3 className="font-display text-lg font-bold">{list[0].weekTitle}</h3>
              <p className="text-sm text-muted">{done} of {list.length} done</p>
            </div>
            <ol className="mt-6 flex flex-col items-center gap-7">
              {list.map((x) => {
                const off = OFFSETS[n++ % OFFSETS.length];
                const isCurrent = x.id === current?.id;
                const boss = x.kind === "boss";
                const Icon = x.state === "completed" ? Check : x.state === "locked" ? Lock : boss ? Swords : isCurrent ? Play : Star;
                const label = x.state === "completed" ? "done" : x.state === "locked" ? "locked" : isCurrent ? (x.state === "in_progress" ? "keep going" : "start here") : "ready";
                const circle = (
                  <span
                    className={cn(
                      "relative grid place-items-center rounded-full border-b-[6px] shadow-sm transition-transform",
                      boss ? "size-24" : "size-20",
                      x.state === "completed" && "border-success/70 bg-success text-primary-fg",
                      x.state === "locked" && "border-border bg-surface-2 text-muted",
                      (x.state === "available" || x.state === "in_progress") && "border-primary/60 bg-primary text-primary-fg group-hover:-translate-y-0.5",
                      isCurrent && "ring-4 ring-accent ring-offset-4 ring-offset-bg",
                    )}
                  >
                    <Icon className={boss ? "size-10" : "size-8"} aria-hidden strokeWidth={2.5} />
                  </span>
                );
                const body = (
                  <>
                    {isCurrent && (
                      <span className="mb-2 rounded-xl bg-accent px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-primary-fg">
                        {x.state === "in_progress" ? "Keep going" : "Start"}
                      </span>
                    )}
                    {circle}
                    <span className={cn("mt-2 max-w-[9rem] text-center sm:max-w-[11rem] font-semibold leading-tight", x.state === "locked" && "text-muted")}>{x.title}</span>
                    {x.due && x.state !== "completed" && <span className="mt-1 text-xs font-semibold text-warning">Due {x.due}</span>}
                    <span className="sr-only">, {label}{boss ? ", boss mission" : ""}</span>
                  </>
                );
                return (
                  <li key={x.id} style={{ ["--off" as string]: off }} className="flex translate-x-[calc(var(--off)*2.25rem)] flex-col items-center sm:translate-x-[calc(var(--off)*3.5rem)]">
                    {x.state === "locked" ? (
                      <div className="flex flex-col items-center opacity-80">{body}</div>
                    ) : (
                      <Link href={x.href} className="group flex flex-col items-center rounded-2xl p-1" aria-current={isCurrent ? "step" : undefined}>
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}

/** Streak, XP, daily goal and this week's activity. */
export function StreakCard({ stats }: { stats: Stats }) {
  const pct = Math.min(100, Math.round((stats.todayXp / stats.goal) * 100));
  const r = 26;
  const c = 2 * Math.PI * r;
  const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow", timeZone: "UTC" });
  return (
    <section aria-label="Your streak and goal" className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-border bg-surface p-4 text-center">
        <Flame className={cn("mx-auto size-8", stats.streak ? "text-warning" : "text-muted")} aria-hidden />
        <p className="font-display text-2xl font-bold">{stats.streak}</p>
        <p className="text-xs text-muted">day streak</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 text-center">
        <svg viewBox="0 0 64 64" className="mx-auto size-12 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
        </svg>
        <p className="mt-1 font-display text-lg font-bold">{stats.todayXp}/{stats.goal}</p>
        <p className="text-xs text-muted">{pct >= 100 ? "goal done today!" : "today's goal"}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 text-center">
        <Sparkles className="mx-auto size-8 text-accent" aria-hidden />
        <p className="font-display text-2xl font-bold">{stats.xp}</p>
        <p className="text-xs text-muted">total XP</p>
      </div>
      <ol className="col-span-3 flex justify-between rounded-2xl border border-border bg-surface px-4 py-3" aria-label="This week">
        {stats.week.map((d, i) => (
          <li key={d.day} className="flex flex-col items-center gap-1 text-xs">
            <span className={cn("grid size-8 place-items-center rounded-full", d.xp > 0 ? "bg-warning text-primary-fg" : "bg-surface-2 text-muted", i === 6 && "ring-2 ring-primary")}>
              {d.xp > 0 ? <Flame className="size-4" aria-hidden /> : <Target className="size-4" aria-hidden />}
            </span>
            <span className="text-muted">{dayName(d.day)}<span className="sr-only">{d.xp > 0 ? `: ${d.xp} XP` : ": no activity"}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}
