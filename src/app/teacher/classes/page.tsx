import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { actorOf } from "@/app/actions/_run";
import { teacherCourses } from "@/server/services/courses";
import { EmptyState, PageHeader, Pill } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Classes" };

export default async function Classes() {
  const user = await requireUser("teacher", "org_admin");
  const courses = await teacherCourses(await getDb(), actorOf(user));
  return (
    <>
      <PageHeader title="Classes" actions={<><ButtonLink href="/teacher/classroom" variant="secondary">Import from Google Classroom</ButtonLink><ButtonLink href="/teacher/classes/new">New class</ButtonLink></>} />
      {courses.length === 0 ? (
        <EmptyState title="No classes yet">Create one or import from Google Classroom.</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/teacher/classes/${c.id}`} className="block rounded-2xl border border-border bg-surface p-5 hover:border-primary">
                <p className="font-display text-lg font-bold">{c.name} {c.section && <span className="text-muted">· {c.section}</span>}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <Pill>{c.studentCount} students</Pill>
                  <Pill tone="primary">{c.pathId}</Pill>
                  <Pill tone={c.mapping ? "success" : "neutral"}>{c.mapping ? "Google Classroom" : "Local"}</Pill>
                  <Pill>Join code <span className="font-mono">{c.joinCode}</span></Pill>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
