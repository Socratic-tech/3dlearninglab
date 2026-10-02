import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { actorOf } from "@/app/actions/_run";
import { courseRoster, teacherCourses } from "@/server/services/courses";
import { EmptyState, PageHeader, Pill } from "@/components/ui/card";

export const metadata: Metadata = { title: "Students" };

export default async function Students() {
  const user = await requireUser("teacher", "org_admin");
  const db = await getDb();
  const courses = await teacherCourses(db, actorOf(user));
  const rosters = await Promise.all(courses.map(async (c) => ({ c, r: await courseRoster(db, c.id) })));
  return (
    <>
      <PageHeader title="Students" description="Open a student for their skills, evidence, rubric scores and portfolio work." />
      {courses.length === 0 && <EmptyState title="No students yet" />}
      {rosters.map(({ c, r }) => (
        <section key={c.id} className="mb-6">
          <h2 className="mb-2 font-display text-lg font-bold">{c.name}{c.section && ` · ${c.section}`}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {r.map((s) => (
              <li key={s.id}><Link href={`/teacher/classes/${c.id}/students/${s.id}`} className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 hover:border-primary"><span className="font-semibold">{s.displayName}</span>{s.status !== "active" && <Pill tone="warning">{s.status === "archived" ? "Archived" : "Not in roster"}</Pill>}</Link></li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
