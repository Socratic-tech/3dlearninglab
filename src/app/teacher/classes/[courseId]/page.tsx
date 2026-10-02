import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { classDashboard } from "@/server/services/dashboard";
import { Card, CardTitle, Stat } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

export default async function ClassOverview(props: PageProps<"/teacher/classes/[courseId]">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId } = await props.params;
  const d = await guard(classDashboard(await getDb(), actorOf(user), courseId));
  const m = d.course.mapping;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Students" value={d.activeCount} />
        <Stat label="Active today" value={d.activeToday} />
        <Stat label="Awaiting review" value={<Link href={`/teacher/classes/${courseId}/review`} className="hover:text-primary">{d.awaitingReview}</Link>} />
        <Stat label="Print queue" value={<Link href={`/teacher/print-queue?course=${courseId}`} className="hover:text-primary">{(d.printCounts.submitted ?? 0) + (d.printCounts.approved ?? 0) + (d.printCounts.queued ?? 0) + (d.printCounts.printing ?? 0)}</Link>} hint={`${d.printCounts.printing ?? 0} printing`} />
        <Stat label="Classroom sync" value={m ? (m.lastSyncStatus === "error" ? "Failed" : "OK") : "—"} hint={m?.lastSyncedAt ? `Last ${m.lastSyncedAt.toLocaleString()}` : "Not linked"} />
      </div>
      <Card>
        <CardTitle>Students who may need help</CardTitle>
        <p className="text-sm text-muted">Informational — a nudge for a check-in, not a judgement.</p>
        {d.help.length ? (
          <ul className="mt-3 divide-y divide-border">
            {d.help.map((h, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 py-2">
                <Link href={h.href} className="font-semibold hover:text-primary">{h.name}</Link>
                <span className="text-sm text-muted">{h.reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm">No one flagged right now.</p>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Mission completion</CardTitle>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-2">
            {d.completion.map((c) => (
              <li key={c.lessonId} className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted">W{c.week}</span>
                <div>
                  <span className="block truncate font-semibold">{c.title}</span>
                  <ProgressBar value={d.activeCount ? (c.completed / d.activeCount) * 100 : 0} label={`${c.title} completion`} />
                </div>
                <span className="text-right font-mono text-xs">{c.completed}/{d.activeCount}</span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardTitle>Competency mastery</CardTitle>
            <ul className="mt-3 space-y-2 text-sm">
              {d.mastery.filter((x) => x.attempted).map((x) => (
                <li key={x.id} className="grid grid-cols-[8rem_1fr_3.5rem] items-center gap-2">
                  <span className="truncate font-semibold">{x.label}</span>
                  <ProgressBar value={d.activeCount ? (x.proficient / d.activeCount) * 100 : 0} label={`${x.label} proficient`} />
                  <span className="text-right font-mono text-xs">{x.proficient}/{d.activeCount}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Common misconceptions</CardTitle>
            {d.misconceptions.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {d.misconceptions.map((m, i) => (
                  <li key={i}>
                    <p><span className="font-semibold">{m.text}</span> <span className="text-muted">({m.students} student{m.students === 1 ? "" : "s"}, {m.lessonTitle})</span></p>
                    {m.response && <p className="text-muted">Try: {m.response}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">None recorded yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
