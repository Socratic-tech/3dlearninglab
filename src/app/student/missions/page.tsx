import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { studentContext } from "@/server/queries/student";
import { getPath } from "@/content";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { MissionPath, StreakCard } from "@/components/student/mission-path";
import { studentStats } from "@/server/services/stats";
import { JoinClassCard } from "@/components/student/join-class";

export const metadata: Metadata = { title: "Missions" };

export default async function Missions() {
  const user = await requireUser("student");
  const ctx = await studentContext(user);
  if (!ctx.course) return <JoinClassCard />;
  const path = getPath(ctx.course.pathId);
  const byWeek = new Map<number, typeof ctx.curriculum>();
  for (const c of ctx.curriculum) byWeek.set(c.week, [...(byWeek.get(c.week) ?? []), c]);
  const stats = await studentStats(ctx.db, user.id, ctx.course.id);
  return (
    <>
      <PageHeader eyebrow={path.id} title="Missions" description={path.title} />
      {ctx.curriculum.length === 0 && <EmptyState title="No missions yet">Your teacher hasn&apos;t turned on any missions.</EmptyState>}
      {stats && <div className="mx-auto mb-8 max-w-md"><StreakCard stats={stats} /></div>}
      <MissionPath
        items={path.weeks.flatMap((w) =>
          (byWeek.get(w.week) ?? []).map(({ lesson, dueAt }) => ({
            id: lesson.id,
            title: lesson.title,
            kind: lesson.kind,
            state: ctx.states?.get(lesson.id) ?? "locked",
            href: `/student/lessons/${lesson.id}`,
            week: w.week,
            weekTitle: w.title,
            due: dueAt ? dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null,
          })),
        )}
      />
    </>
  );
}
