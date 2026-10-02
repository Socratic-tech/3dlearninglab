import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { paths, getLesson } from "@/content";
import { PageHeader, Pill } from "@/components/ui/card";

export const metadata: Metadata = { title: "Curriculum" };

export default async function Curriculum() {
  await requireUser("teacher", "org_admin");
  return (
    <>
      <PageHeader title="Curriculum" description="Open any mission for its Teacher View: purpose, prep, misconceptions, answers, slicer settings and rubric." />
      <div className="grid gap-6 lg:grid-cols-2">
        {paths.map((p) => (
          <section key={p.id} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-bold">{p.title}</h2>
            <ol className="mt-3 space-y-3">
              {p.weeks.map((w) => (
                <li key={w.week}>
                  <p className="text-xs font-semibold uppercase text-accent">Week {w.week} · {w.title}</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {w.lessonIds.map((id) => { const l = getLesson(id)!; return (
                      <li key={id} className="flex items-center gap-2">
                        <Link href={`/teacher/curriculum/${id}`} className="font-semibold hover:text-primary">{l.title}</Link>
                        <Pill>{l.printLevel}</Pill>{l.kind !== "lesson" && <Pill tone="accent">{l.kind}</Pill>}
                      </li>); })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
