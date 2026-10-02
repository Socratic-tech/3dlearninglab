import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Lock, PlayCircle, Swords } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { studentContext } from "@/server/queries/student";
import { getPath } from "@/content";
import { PageHeader, Pill, EmptyState } from "@/components/ui/card";
import { JoinClassCard } from "@/components/student/join-class";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Missions" };

export default async function Missions() {
  const user = await requireUser("student");
  const ctx = await studentContext(user);
  if (!ctx.course) return <JoinClassCard />;
  const path = getPath(ctx.course.pathId);
  const byWeek = new Map<number, typeof ctx.curriculum>();
  for (const c of ctx.curriculum) byWeek.set(c.week, [...(byWeek.get(c.week) ?? []), c]);
  return (
    <>
      <PageHeader eyebrow={path.id} title="Missions" description={path.title} />
      {ctx.curriculum.length === 0 && <EmptyState title="No missions yet">Your teacher hasn&apos;t turned on any missions.</EmptyState>}
      <ol className="relative space-y-8 border-l-2 border-border pl-6">
        {path.weeks.map((w) => {
          const items = byWeek.get(w.week) ?? [];
          if (!items.length) return null;
          return (
            <li key={w.week}>
              <span className="absolute -left-[9px] mt-1.5 size-4 rounded-full border-2 border-primary bg-bg" aria-hidden />
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Week {w.week}</p>
              <h2 className="font-display text-lg font-bold">{w.title}</h2>
              <p className="text-sm text-muted">{w.focus}</p>
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map(({ lesson, dueAt }) => {
                  const st = ctx.states?.get(lesson.id) ?? "locked";
                  const Icon = st === "completed" ? CircleCheck : st === "locked" ? Lock : lesson.kind === "boss" ? Swords : PlayCircle;
                  const inner = (
                    <>
                      <Icon className={cn("size-6 shrink-0", st === "completed" ? "text-success" : st === "locked" ? "text-muted" : "text-primary")} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{lesson.title}</span>
                        <span className="block truncate text-sm text-muted">{lesson.subtitle}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <Pill tone={st === "completed" ? "success" : st === "locked" ? "neutral" : "primary"}>
                            {st === "completed" ? "Completed" : st === "locked" ? "Locked" : st === "in_progress" ? "In progress" : "Ready"}
                          </Pill>
                          {lesson.kind === "boss" && <Pill tone="accent">Boss</Pill>}
                          {dueAt && st !== "completed" && <Pill tone="warning">Due {dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Pill>}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={lesson.id} className="min-w-0">
                      {st === "locked" ? (
                        <div className="flex gap-3 rounded-xl border border-dashed border-border p-4 opacity-75" aria-disabled>
                          {inner}
                        </div>
                      ) : (
                        <Link href={`/student/lessons/${lesson.id}`} className="flex gap-3 rounded-xl border border-border bg-surface p-4 hover:border-primary">
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </>
  );
}
