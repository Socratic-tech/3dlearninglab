import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { assertTeacherOfCourse } from "@/server/policy";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { reviewQueue } from "@/server/services/evidence";
import { getLesson } from "@/content";
import { EmptyState, Pill } from "@/components/ui/card";
import { EvidenceReviewCard } from "@/components/teacher/evidence-review";

export default async function Review(props: PageProps<"/teacher/classes/[courseId]/review">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId } = await props.params;
  const status = (await props.searchParams).status === "all" ? (["submitted", "reviewed", "needs_revision"] as const) : (["submitted"] as const);
  const db = await getDb();
  await guard(assertTeacherOfCourse(db, actorOf(user), courseId));
  const rows = await reviewQueue(db, courseId, { status: [...status] });
  return (
    <div>
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="?status=submitted" className="rounded-lg border border-border px-3 py-1">Awaiting review</Link>
        <Link href="?status=all" className="rounded-lg border border-border px-3 py-1">All evidence</Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nothing waiting for review">New submissions appear here.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ evidence: e, student }) => (
            <li key={e.id}>
              <EvidenceReviewCard
                courseId={courseId}
                e={{ id: e.id, type: e.type, url: e.url, fileKey: e.fileKey, fileName: e.fileName, mimeType: e.mimeType, response: e.response, status: e.status, teacherRating: e.teacherRating, teacherComment: e.teacherComment, createdAt: e.createdAt.toISOString(), competencyIds: e.competencyIds }}
                header={
                  <>
                    <Link href={`/teacher/classes/${courseId}/students/${student.id}`} className="font-semibold hover:text-primary">{student.displayName}</Link>
                    <span className="text-muted"> · {getLesson(e.lessonId)?.title}</span>
                    {e.status !== "submitted" && <Pill className="ml-2">{e.status}</Pill>}
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
