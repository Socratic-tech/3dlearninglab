import { tr } from "@/lib/i18n";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Lock, Play, Star, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PathItem } from "./mission-path";

export type NextUpItem = PathItem & {
  subtitle?: string;
  minutes?: number;
  /** required activities finished / total, for the "Keep going" card */
  steps?: { done: number; total: number };
};

/**
 * "Next-up focus" mission menu (UDL: one clear next step, the rest one tap away).
 * 1. A big Keep going / Start card for the current mission.
 * 2. The current unit's missions as tiles.
 * 3. Everything else folded: finished units in one list, each upcoming unit in its own list.
 */
/** `simple` (grades 4–5): just "keep going" and this unit's missions, no full mission list. */
export function NextUpPath({ items, simple }: { items: NextUpItem[]; simple?: boolean }) {
  const current = items.find((x) => x.state === "in_progress") ?? items.find((x) => x.state === "available");
  const weeks = new Map<number, NextUpItem[]>();
  items.forEach((x) => weeks.set(x.week, [...(weeks.get(x.week) ?? []), x]));
  const units = [...weeks.entries()].map(([week, list]) => ({ week, title: list[0].weekTitle, list, done: list.filter((x) => x.state === "completed").length }));
  const curUnit = current ? units.find((u) => u.week === current.week) : undefined;
  const finished = units.filter((u) => u !== curUnit && u.done === u.list.length);
  const upcoming = units.filter((u) => u !== curUnit && u.done < u.list.length);
  const allDone = !current && items.length > 0 && items.every((x) => x.state === "completed");

  return (
    <div className="space-y-6">
      {current ? <KeepGoing item={current} /> : allDone ? <CourseDone /> : null}

      {curUnit && (
        <section aria-labelledby="unit-h">
          <h2 id="unit-h" className="mb-3 font-display text-lg font-bold">
            <span className="mr-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent">{tr("Unit {n}", { n: curUnit.week })}</span>
            {curUnit.title}
          </h2>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {curUnit.list.map((x) => (
              <li key={x.id}><Tile item={x} current={x.id === current?.id} /></li>
            ))}
          </ol>
        </section>
      )}

      {!simple && <section aria-labelledby="all-h" className="space-y-2">
        <h2 id="all-h" className="font-display text-lg font-bold">{tr("All missions")}</h2>
        {finished.length > 0 && (
          <Fold
            summary={<><Check className="size-5 text-success" aria-hidden /> {finished.length === 1 ? tr("1 unit done") : tr("{n} units done", { n: finished.length })}</>}
            count={tr("{n} missions", { n: finished.reduce((s, u) => s + u.list.length, 0) })}
          >
            {finished.map((u) => <UnitList key={u.week} unit={u} />)}
          </Fold>
        )}
        {upcoming.slice(0, 3).map((u) => {
          const open = u.list.some((x) => x.state !== "locked");
          return (
            <Fold
              key={u.week}
              summary={<>{open ? <Star className="size-5 text-primary" aria-hidden /> : <Lock className="size-5 text-muted" aria-hidden />} <span className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-accent">{tr("Unit {n}", { n: u.week })}</span> <span className="min-w-0">{u.title}</span></>}
              count={u.done ? tr("{done} of {total} done", { done: u.done, total: u.list.length }) : String(u.list.length)}
            >
              <UnitList unit={u} bare />
            </Fold>
          );
        })}
        {upcoming.length > 3 && (
          <Fold
            summary={<><Lock className="size-5 text-muted" aria-hidden /> {tr("{n} more units", { n: upcoming.length - 3 })}</>}
            count={tr("to {last}", { last: upcoming[upcoming.length - 1].title })}
          >
            {upcoming.slice(3).map((u) => <UnitList key={u.week} unit={u} />)}
          </Fold>
        )}
      </section>}
    </div>
  );
}

function KeepGoing({ item }: { item: NextUpItem }) {
  const started = item.state === "in_progress";
  const steps = item.steps && item.steps.total > 0 ? item.steps : null;
  const boss = item.kind === "boss";
  return (
    <section aria-label={tr("Your next mission")} className="rounded-3xl bg-gradient-to-br from-primary to-[#1e40af] p-6 text-primary-fg shadow-lg">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] opacity-90">
        {started ? tr("Keep going") : tr("Up next")} · {tr("Unit {n}", { n: item.week })}
      </p>
      <h2 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
        {boss && <Swords className="size-7" aria-hidden />}
        {item.title}
      </h2>
      {(item.subtitle || item.minutes) && (
        <p className="mt-1 opacity-90">{[item.subtitle, item.minutes ? tr("about {n} min", { n: item.minutes }) : ""].filter(Boolean).join(" · ")}</p>
      )}
      {item.due && <p className="mt-1 font-semibold">{tr("Due {date}", { date: item.due })}</p>}
      {steps && (
        <div className="mt-4">
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: steps.total }, (_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded-full", i < steps.done ? "bg-white" : "bg-white/30")} />
            ))}
          </div>
          <p className="mt-1 text-sm opacity-90">{tr("{done} of {total} activities done", { done: steps.done, total: steps.total })}</p>
        </div>
      )}
      <Link href={item.href} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-display text-lg font-bold text-primary shadow-sm hover:brightness-95" aria-current="step">
        {started ? tr("Continue") : tr("Start")} <ArrowRight className="size-5" aria-hidden />
      </Link>
    </section>
  );
}

function CourseDone() {
  return (
    <section className="rounded-3xl border-2 border-success bg-success-soft p-6 text-center">
      <Trophy className="mx-auto size-10 text-success" aria-hidden />
      <h2 className="mt-2 font-display text-2xl font-bold">{tr("You finished every mission!")}</h2>
      <p className="text-muted">{tr("Open any mission below to look back at your work.")}</p>
    </section>
  );
}

function stateIcon(x: NextUpItem, current: boolean) {
  if (x.state === "completed") return <Check className="size-5" aria-hidden strokeWidth={3} />;
  if (x.state === "locked") return <Lock className="size-4" aria-hidden />;
  if (x.kind === "boss") return <Swords className="size-5" aria-hidden />;
  return current ? <Play className="size-5" aria-hidden /> : <Star className="size-4" aria-hidden />;
}
function stateLabel(x: NextUpItem, current: boolean) {
  return tr(x.state === "completed" ? "done" : x.state === "locked" ? "locked" : current ? (x.state === "in_progress" ? "keep going" : "start here") : "ready");
}
const dot = (x: NextUpItem, current: boolean) =>
  cn(
    "grid size-9 shrink-0 place-items-center rounded-full",
    x.state === "completed" && "bg-success text-primary-fg",
    x.state === "locked" && "bg-surface-2 text-muted",
    (x.state === "available" || x.state === "in_progress") && !current && "border-2 border-primary bg-primary-soft text-primary",
    current && "bg-accent text-primary-fg ring-4 ring-accent/25",
  );

function Tile({ item, current }: { item: NextUpItem; current: boolean }) {
  const body = (
    <>
      <span className={dot(item, current)}>{stateIcon(item, current)}</span>
      <span className={cn("mt-2 text-sm font-semibold leading-tight", item.state === "locked" && "text-muted")}>{item.title}</span>
      <span className="sr-only">, {stateLabel(item, current)}</span>
    </>
  );
  const cls = cn("flex h-full flex-col items-center rounded-2xl border bg-surface p-3 text-center", current ? "border-2 border-accent" : "border-border");
  return item.state === "locked" ? <div className={cn(cls, "opacity-75")}>{body}</div> : <Link href={item.href} className={cn(cls, "hover:bg-surface-2")}>{body}</Link>;
}

function Fold({ summary, count, children }: { summary: React.ReactNode; count: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 items-center gap-2">{summary}</span>
        <span className="text-sm font-normal text-muted">{count}</span>
        <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-border px-4 py-2">{children}</div>
    </details>
  );
}

function UnitList({ unit, bare }: { unit: { week: number; title: string; list: NextUpItem[] }; bare?: boolean }) {
  return (
    <div className="py-1">
      {!bare && <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">{tr("Unit {n}", { n: unit.week })} · {unit.title}</p>}
      <ol>
        {unit.list.map((x) => {
          const row = (
            <>
              <span className={cn(dot(x, false), "size-7")}>{stateIcon(x, false)}</span>
              <span className={cn("flex-1", x.state === "locked" && "text-muted")}>{x.title}</span>
              {x.kind === "boss" && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">{tr("Boss battle")}</span>}
              {x.minutes ? <span className="text-xs text-muted">{tr("{n} min", { n: x.minutes })}</span> : null}
              <span className="sr-only">, {stateLabel(x, false)}</span>
            </>
          );
          return (
            <li key={x.id}>
              {x.state === "locked" ? (
                <div className="flex items-center gap-3 py-1.5 text-sm">{row}</div>
              ) : (
                <Link href={x.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">{row}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
