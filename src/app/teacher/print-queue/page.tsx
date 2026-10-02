import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { actorOf } from "@/app/actions/_run";
import { teacherPrintQueue, PRINT_STATUS_LABEL } from "@/server/services/print-queue";
import { PageHeader } from "@/components/ui/card";
import { PrintJobCard } from "@/components/teacher/print-job-card";
import type { PrintStatus } from "@/server/policy";

export const metadata: Metadata = { title: "Print Queue" };
const COLUMNS: PrintStatus[] = ["submitted", "needs_revision", "approved", "queued", "printing", "completed", "failed"];

export default async function PrintQueue(props: PageProps<"/teacher/print-queue">) {
  const user = await requireUser("teacher", "org_admin");
  const course = (await props.searchParams).course;
  const jobs = await teacherPrintQueue(await getDb(), actorOf(user), { courseId: typeof course === "string" ? course : undefined });
  return (
    <>
      <PageHeader title="Print Queue" description="Workflow only — this doesn't control your printers. Approve, queue, and record what happened so students learn from failures." />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = jobs.filter((j) => j.job.status === col);
          return (
            <section key={col} aria-labelledby={`col-${col}`} className="w-72 shrink-0 rounded-2xl bg-surface-2/60 p-3">
              <h2 id={`col-${col}`} className="mb-2 flex items-center justify-between text-sm font-bold">
                {PRINT_STATUS_LABEL[col]} <span className="rounded-full bg-surface px-2 font-mono text-xs">{items.length}</span>
              </h2>
              <div className="space-y-2">
                {items.map((j) => <PrintJobCard key={j.job.id} job={j.job} student={j.student} course={j.course} />)}
                {items.length === 0 && <p className="text-xs text-muted">Empty</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
