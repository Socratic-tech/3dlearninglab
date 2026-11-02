import { getLocale, tr } from "@/lib/i18n";
import Link from "next/link";
import { Fragment } from "react";
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
    <ol className="mx-auto max-w-md space-y-10 [--unit:2.25rem] sm:[--unit:3.5rem]" aria-label={tr("Mission path")}>
      {[...weeks.entries()].map(([week, list]) => {
        const done = list.filter((x) => x.state === "completed").length;
        return (
          <li key={week}>
            <div className={cn("rounded-2xl px-5 py-3 text-center", done === list.length ? "bg-success-soft" : "bg-primary-soft")}>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{tr("Unit {n}", { n: week })}</p>
              <h3 className="font-display text-lg font-bold">{list[0].weekTitle}</h3>
              <p className="text-sm text-muted">{tr("{done} of {total} done", { done, total: list.length })}</p>
              <div className="mx-auto mt-2 h-2 max-w-[10rem] overflow-hidden rounded-full bg-surface/80" aria-hidden>
                <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${Math.round((done / list.length) * 100)}%` }} />
              </div>
            </div>
            <ol className="mt-6 flex flex-col items-center">
              {list.map((x, idx) => {
                const off = OFFSETS[n % OFFSETS.length];
                const nextOff = OFFSETS[(n + 1) % OFFSETS.length];
                n++;
                const next = list[idx + 1];
                const trailDone = x.state === "completed";
                const isCurrent = x.id === current?.id;
                const boss = x.kind === "boss";
                const Icon = x.state === "completed" ? Check : x.state === "locked" ? Lock : boss ? Swords : isCurrent ? Play : Star;
                const label = tr(x.state === "completed" ? "done" : x.state === "locked" ? "locked" : isCurrent ? (x.state === "in_progress" ? "keep going" : "start here") : "ready");
                const circle = (
                  <span
                    className={cn(
                      "relative grid place-items-center overflow-hidden rounded-full border-b-[6px] shadow-[0_6px_14px_-6px_rgba(15,27,45,0.45),inset_0_2px_0_rgba(255,255,255,0.35)] transition-transform before:pointer-events-none before:absolute before:inset-x-3 before:top-1 before:h-1/3 before:rounded-full before:bg-white/25 before:content-[''] motion-reduce:transition-none",
                      boss ? "size-24" : "size-20",
                      x.state === "completed" && "border-success/70 bg-success text-primary-fg",
                      x.state === "locked" && "border-border bg-surface-2 text-muted",
                      (x.state === "available" || x.state === "in_progress") && "border-primary/60 bg-primary text-primary-fg group-hover:-translate-y-0.5",
                      isCurrent && "ring-4 ring-accent ring-offset-4 ring-offset-bg",
                      x.state === "completed" && "shadow-[0_6px_14px_-6px_rgba(21,128,61,0.6),inset_0_2px_0_rgba(255,255,255,0.35)]",
                    )}
                  >
                    <Icon className={cn("relative", boss ? "size-10" : "size-8")} aria-hidden strokeWidth={2.5} />
                  </span>
                );
                const body = (
                  <>
                    {isCurrent && (
                      <span className="mb-2 rounded-xl bg-accent px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-primary-fg">
                        {x.state === "in_progress" ? tr("Keep going") : tr("Start")}
                      </span>
                    )}
                    <span className="relative grid place-items-center">
                      {isCurrent && <span aria-hidden className="mission-pulse absolute inset-0 rounded-full bg-accent/40" />}
                      {circle}
                    </span>
                    <span className={cn("mt-2 max-w-[9rem] text-center sm:max-w-[11rem] font-semibold leading-tight", x.state === "locked" && "text-muted")}>{x.title}</span>
                    {x.due && x.state !== "completed" && <span className="mt-1 text-xs font-semibold text-warning">{tr("Due {date}", { date: x.due })}</span>}
                    <span className="sr-only">, {label}{boss ? tr(", boss mission") : ""}</span>
                  </>
                );
                const item = (
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
                return next ? (
                  <Fragment key={x.id}>
                    {item}
                    <li
                      aria-hidden
                      role="presentation"
                      style={{ ["--a" as string]: (off + nextOff) / 2, ["--d" as string]: Math.abs(nextOff - off) }}
                      className="relative h-9 w-0 translate-x-[calc(var(--a)*var(--unit))]"
                    >
                      <svg
                        viewBox="0 0 1 1"
                        preserveAspectRatio="none"
                        className="absolute left-1/2 top-0 h-full -translate-x-1/2 overflow-visible"
                        style={{ width: "max(2px, calc(var(--d) * var(--unit)))", transform: `translateX(-50%) scaleX(${nextOff < off ? -1 : 1})` }}
                      >
                        <line
                          x1={nextOff === off ? 0.5 : 0}
                          y1="0"
                          x2={nextOff === off ? 0.5 : 1}
                          y2="1"
                          vectorEffect="non-scaling-stroke"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="1 9"
                          stroke={trailDone ? "var(--success)" : "var(--border)"}
                        />
                      </svg>
                    </li>
                  </Fragment>
                ) : (
                  item
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
  const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString(getLocale() === "es" ? "es" : undefined, { weekday: "narrow", timeZone: "UTC" });
  return (
    <section aria-label={tr("Your streak and goal")} className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2/60 p-4 text-center shadow-[0_8px_16px_-12px_rgba(15,27,45,0.35)]">
        <Flame className={cn("mx-auto size-8", stats.streak ? "text-warning drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]" : "text-muted")} aria-hidden />
        <p className="font-display text-2xl font-bold">{stats.streak}</p>
        <p className="text-xs text-muted">{tr("day streak")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2/60 p-4 text-center shadow-[0_8px_16px_-12px_rgba(15,27,45,0.35)]">
        <svg viewBox="0 0 64 64" className="mx-auto size-12 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 800ms ease-out", filter: pct > 0 ? "drop-shadow(0 0 3px var(--accent))" : undefined }} />
        </svg>
        <p className="mt-1 font-display text-lg font-bold">{stats.todayXp}/{stats.goal}</p>
        <p className="text-xs text-muted">{pct >= 100 ? tr("goal done today!") : tr("today's goal")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2/60 p-4 text-center shadow-[0_8px_16px_-12px_rgba(15,27,45,0.35)]">
        <Sparkles className="mx-auto size-8 text-accent drop-shadow-[0_0_6px_rgba(251,191,90,0.7)]" aria-hidden />
        <p className="font-display text-2xl font-bold">{stats.xp}</p>
        <p className="text-xs text-muted">{tr("total XP")}</p>
      </div>
      <ol className="col-span-3 flex justify-between rounded-2xl border border-border bg-surface px-4 py-3" aria-label={tr("This week")}>
        {stats.week.map((d, i) => (
          <li key={d.day} className="flex flex-col items-center gap-1 text-xs">
            <span className={cn("grid size-8 place-items-center rounded-full", d.xp > 0 ? "bg-warning text-primary-fg shadow-[0_0_8px_rgba(245,158,11,0.55)]" : "bg-surface-2 text-muted", i === 6 && "ring-2 ring-primary")}>
              {d.xp > 0 ? <Flame className="size-4" aria-hidden /> : <Target className="size-4" aria-hidden />}
            </span>
            <span className="text-muted">{dayName(d.day)}<span className="sr-only">{d.xp > 0 ? `: ${d.xp} XP` : tr(": no activity")}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}
