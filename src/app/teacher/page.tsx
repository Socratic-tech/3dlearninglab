import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { actorOf } from "@/app/actions/_run";
import { teacherCourses } from "@/server/services/courses";
import { classDashboard } from "@/server/services/dashboard";
import { syncStaleRosters } from "@/server/integrations/google/classroom";
import { Card, EmptyState, PageHeader, Pill } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function TeacherHome() {
  const user = await requireUser("teacher", "org_admin");
  const db = await getDb();
  const actor = actorOf(user);
  await syncStaleRosters(db, actor).catch(() => undefined); // safe periodic sync; failures are shown per class
  const courses = await teacherCourses(db, actor);
  const dashes = await Promise.all(courses.map((c) => classDashboard(db, actor, c.id)));
  return (
    <>
      <PageHeader eyebrow="Teacher" title={`Hello, ${user.displayName}`} description="What needs you today, across your classes." actions={<ButtonLink href="/teacher/classes/new">New class</ButtonLink>} />
      {courses.length === 0 && (
        <EmptyState title="No classes yet" action={<div className="flex gap-2"><ButtonLink href="/teacher/classroom">Import from Google Classroom</ButtonLink><ButtonLink href="/teacher/classes/new" variant="secondary">Create a class</ButtonLink></div>}>
          Connect Google Classroom to import your roster, or create a class and share its join code.
        </EmptyState>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {dashes.map((d) => (
          <Card key={d.course.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/teacher/classes/${d.course.id}`} className="font-display text-xl font-bold hover:text-primary">
                  {d.course.name} {d.course.section && <span className="text-muted">· {d.course.section}</span>}
                </Link>
                <p className="text-sm text-muted">{d.activeCount} students · {d.course.pathId} course</p>
              </div>
              {d.course.mapping ? (
                <Pill tone={d.course.mapping.lastSyncStatus === "error" ? "danger" : "success"}>
                  Classroom {d.course.mapping.lastSyncStatus === "error" ? "sync failed" : "linked"}
                </Pill>
              ) : (
                <Pill>Not linked</Pill>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-surface-2 p-2"><dt className="text-xs text-muted">Active today</dt><dd className="font-display text-xl font-bold">{d.activeToday}</dd></div>
              <div className="rounded-lg bg-surface-2 p-2"><dt className="text-xs text-muted">To review</dt><dd className="font-display text-xl font-bold">{d.awaitingReview}</dd></div>
              <div className="rounded-lg bg-surface-2 p-2"><dt className="text-xs text-muted">Print queue</dt><dd className="font-display text-xl font-bold">{(d.printCounts.submitted ?? 0) + (d.printCounts.approved ?? 0) + (d.printCounts.queued ?? 0)}</dd></div>
            </dl>
            <h3 className="mt-4 text-sm font-semibold">Students who may need help</h3>
            {d.help.length ? (
              <ul className="mt-1 space-y-1 text-sm">
                {d.help.slice(0, 4).map((h, i) => (
                  <li key={i}>
                    <Link href={h.href} className="font-semibold hover:text-primary">{h.name}</Link> <span className="text-muted">— {h.reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No one flagged right now.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink size="sm" href={`/teacher/classes/${d.course.id}`}>Open class</ButtonLink>
              <ButtonLink size="sm" variant="secondary" href={`/teacher/classes/${d.course.id}/review`}>Review ({d.awaitingReview})</ButtonLink>
              <ButtonLink size="sm" variant="secondary" href={`/teacher/classes/${d.course.id}/heatmap`}>Heatmap</ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
