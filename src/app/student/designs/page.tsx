import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { studentContext } from "@/server/queries/student";
import { evidence, portfolioItems } from "@/server/db/schema";
import { studentPrintJobs, PRINT_STATUS_LABEL } from "@/server/services/print-queue";
import { actorOf } from "@/app/actions/_run";
import { getLesson } from "@/content";
import { Card, CardTitle, EmptyState, PageHeader, Pill } from "@/components/ui/card";
import { PrintJobActions, PrintRequestForm, FeatureToggle } from "@/components/student/print-request";

export const metadata: Metadata = { title: "My Designs" };

const TYPE: Record<string, string> = { screenshot: "Screenshot", stl: "STL", obj: "OBJ", design_url: "Design link", written: "Written", physical_test: "Physical test", teacher_observation: "Teacher observation", quiz: "Quiz", project_rubric: "Rubric" };

export default async function Designs() {
  const user = await requireUser("student");
  const ctx = await studentContext(user);
  const ev = await ctx.db.select().from(evidence).where(eq(evidence.studentId, user.id)).orderBy(desc(evidence.createdAt));
  const featured = new Set((await ctx.db.select().from(portfolioItems).where(eq(portfolioItems.studentId, user.id))).map((p) => p.evidenceId));
  const jobs = await studentPrintJobs(ctx.db, actorOf(user));
  const designs = ev.filter((e) => e.type !== "written" && e.type !== "teacher_observation");
  return (
    <>
      <PageHeader title="My Designs" description="Everything you've submitted, and your print requests." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="sub-h">
          <h2 id="sub-h" className="mb-3 font-display text-xl font-bold">Submissions</h2>
          {designs.length === 0 ? (
            <EmptyState title="No designs yet">Submit a design link, screenshot or STL from any mission.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {designs.map((e) => (
                <li key={e.id}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="primary">{TYPE[e.type]}</Pill>
                      <Link href={`/student/lessons/${e.lessonId}`} className="font-semibold hover:text-primary">
                        {getLesson(e.lessonId)?.title}
                      </Link>
                      <Pill tone={e.status === "reviewed" ? "success" : e.status === "needs_revision" ? "warning" : "neutral"}>{e.status === "needs_revision" ? "Revise" : e.status}</Pill>
                      <span className="ml-auto text-xs text-muted">{e.createdAt.toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-sm">
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {e.url}
                        </a>
                      ) : e.fileKey ? (
                        <a href={`/api/files/${e.fileKey}`} className="text-primary underline">
                          {e.fileName}
                        </a>
                      ) : (
                        e.response
                      )}
                    </p>
                    {e.teacherComment && <p className="mt-2 rounded-lg bg-surface-2 p-2 text-sm">Teacher: {e.teacherComment}</p>}
                    <div className="mt-2">
                      <FeatureToggle evidenceId={e.id} featured={featured.has(e.id)} />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="pq-h" className="space-y-4">
          <h2 id="pq-h" className="font-display text-xl font-bold">Print requests</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted">No print requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {jobs.map((j) => (
                <li key={j.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{j.title}</span>
                    <Pill tone={j.status === "completed" ? "success" : j.status === "failed" || j.status === "needs_revision" ? "warning" : "primary"}>{PRINT_STATUS_LABEL[j.status]}</Pill>
                    <span className="ml-auto">
                      <PrintJobActions id={j.id} status={j.status} />
                    </span>
                  </div>
                  {j.failureReason && <p className="mt-1">Why it failed: {j.failureReason}</p>}
                  {j.history.at(-1)?.note && <p className="mt-1 text-muted">Teacher: {j.history.at(-1)!.note}</p>}
                </li>
              ))}
            </ul>
          )}
          {ctx.course && (
            <Card>
              <CardTitle as="h3">Request a print</CardTitle>
              <p className="mb-3 text-sm text-muted">Your teacher approves prints. Test only the critical part when you can.</p>
              <PrintRequestForm courseId={ctx.course.id} lessons={ctx.curriculum.filter((c) => c.printLevel !== "digital").map((c) => ({ id: c.lesson.id, title: c.lesson.title }))} />
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
