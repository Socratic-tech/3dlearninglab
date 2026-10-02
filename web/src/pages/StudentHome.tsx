import { ArrowRight } from "lucide-react";
import { MissionPath, StreakCard } from "@/components/student/mission-path";
import { ProgressRing, ProgressBar } from "@/components/ui/progress";
import { rank } from "@/lib/mastery";
import { competencies, domains, pathTitle, type Me } from "../content";
import { studentStates } from "../state";

export function StudentHome({ me }: { me: Me }) {
  const { items, states } = studentStates(me);
  const current = items.find((x) => states.get(x.lesson.id) === "in_progress") ?? items.find((x) => states.get(x.lesson.id) === "available");
  const done = items.filter((x) => states.get(x.lesson.id) === "completed").length;
  const inPath = new Set(items.flatMap((x) => x.lesson.competencyIds));
  const mastered = [...inPath].filter((c) => rank(me.levels[c]) >= 2).length;
  return (
    <div className="space-y-8">
      <section className="bg-blueprint flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-6 text-center sm:flex-row sm:text-left">
        <ProgressRing value={inPath.size ? (mastered / inPath.size) * 100 : 0} size={104} stroke={10} label="Skills mastered" />
        <div className="flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome back</p>
          <h1 className="font-display text-3xl font-bold">{me.user.name.split(" ")[0]}</h1>
          <p className="text-muted">{mastered} of {inPath.size} skills mastered · {done} of {items.length} missions done</p>
        </div>
        {current && (
          <a href={`#/lesson/${current.lesson.id}`} className="flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 text-left text-primary-fg shadow-sm hover:brightness-110">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">Continue mission</span>
              <span className="block font-display text-lg font-bold">{current.lesson.title}</span>
            </span>
            <ArrowRight className="size-6" aria-hidden />
          </a>
        )}
      </section>

      {me.stats && <StreakCard stats={me.stats} />}

      <section aria-labelledby="mis-h">
        <h2 id="mis-h" className="mb-1 text-center font-display text-2xl font-bold">Your path</h2>
        <p className="mb-6 text-center text-sm text-muted">{me.cls ? `${me.cls.name}${me.cls.section ? ` · ${me.cls.section}` : ""} — ${pathTitle(me.cls.pathId)}` : ""}</p>
        <MissionPath
          items={items.map((x) => ({ id: x.lesson.id, title: x.lesson.title, kind: x.lesson.kind, state: states.get(x.lesson.id) ?? "locked", href: `#/lesson/${x.lesson.id}`, week: x.week, weekTitle: x.weekTitle }))}
        />
      </section>

      <section aria-labelledby="sk-h" className="rounded-3xl border border-border bg-surface p-6">
        <h2 id="sk-h" className="font-display text-2xl font-bold">My skills</h2>
        <ul className="mt-4 space-y-3">
          {domains.map((d) => {
            const ids = competencies.filter((c) => c.domain === d.id && inPath.has(c.id)).map((c) => c.id);
            if (!ids.length) return null;
            const v = Math.round((ids.filter((c) => rank(me.levels[c]) >= 2).length / ids.length) * 100);
            return (
              <li key={d.id} className="grid grid-cols-[minmax(7rem,11rem)_1fr_3rem] items-center gap-3">
                <span className="truncate text-sm font-semibold">{d.shortTitle}</span>
                <ProgressBar value={v} label={`${d.title} mastery`} />
                <span className="text-right font-mono text-sm text-muted">{v}%</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
