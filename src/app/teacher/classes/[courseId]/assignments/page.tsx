import { and, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { rubricScores } from "@/server/db/schema";
import { assignmentsForCourse } from "@/server/integrations/google/classroom";
import { courseCurriculum, courseRoster, getCourseForTeacher } from "@/server/services/courses";
import { scaledScore } from "@/server/services/rubrics";
import { publishAction, refreshAssignmentAction, sendGradeAction } from "@/app/actions/teacher";
import { ActionForm } from "@/components/ui/action-form";
import { Alert, Card, CardTitle, Pill } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { getRubric } from "@/content";

export default async function Assignments(props: PageProps<"/teacher/classes/[courseId]/assignments">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId } = await props.params;
  const db = await getDb();
  const actor = actorOf(user);
  const course = await guard(getCourseForTeacher(db, actor, courseId));
  const [list, curriculum, roster, scores] = await Promise.all([
    assignmentsForCourse(db, actor, courseId),
    courseCurriculum(db, course),
    courseRoster(db, courseId),
    db.select().from(rubricScores).where(eq(rubricScores.courseId, courseId)),
  ]);
  const byActivity = new Map(list.map((a) => [a.activityId, a]));
  const published = list.filter((a) => a.status === "published");
  return (
    <div className="space-y-6">
      {!course.mapping && (
        <Alert tone="info" title="Connect Google Classroom to assign activities there">
          <ButtonLink href="/teacher/classroom" size="sm" className="mt-2">Connect Google Classroom</ButtonLink>
        </Alert>
      )}
      {published.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Grades</h2>
          <p className="mb-3 text-sm text-muted">Only assessments you choose are sent to Classroom — skill badges never are. Scores are suggested from rubric results; edit before sending.</p>
          <div className="space-y-4">
            {published.map((a) => {
              const rubric = curriculum.find((c) => c.lesson.id === a.activityId)?.lesson.teacher.rubricId;
              return (
                <Card key={a.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle as="h3">{a.title}</CardTitle>
                    <Pill tone="success">In Classroom</Pill>
                    {a.points !== null && <Pill>{a.points} pts</Pill>}
                    <Pill>{a.gradeSyncMode === "auto" ? "Auto-sync when rubric saved" : "Manual grade sync"}</Pill>
                    {a.googleAlternateLink && <a href={a.googleAlternateLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Open in Classroom</a>}
                    <form action={async () => { "use server"; await refreshAssignmentAction(a.id); }}><button className="text-sm text-muted underline">Check status</button></form>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs uppercase text-muted"><th scope="col" className="py-1">Student</th><th scope="col">Rubric</th><th scope="col">Classroom</th><th scope="col">Send grade</th></tr></thead>
                      <tbody>
                        {roster.filter((s) => s.status !== "archived").map((s) => {
                          const sc = scores.find((x) => x.studentId === s.id && x.lessonId === a.activityId);
                          const g = a.grades.find((x) => x.studentId === s.id);
                          const suggested = sc && a.points ? scaledScore(sc.total, sc.max, a.points) : "";
                          return (
                            <tr key={s.id} className="border-t border-border">
                              <th scope="row" className="py-2 pr-2 text-left font-semibold">{s.displayName}</th>
                              <td className="pr-2">{sc ? `${sc.total}/${sc.max}` : rubric ? <span className="text-muted">not scored</span> : "—"}</td>
                              <td className="pr-2">{g ? <Pill tone={g.status === "synced" ? "success" : "danger"}>{g.status === "synced" ? `Sent ${g.score}` : "Failed"}</Pill> : <span className="text-muted">—</span>}</td>
                              <td className="py-1">
                                <ActionForm action={sendGradeAction.bind(null, a.id, s.id)} submit="Send" size="sm" variant="secondary" integration className="flex flex-wrap items-center gap-2 space-y-0">
                                  <label className="sr-only" htmlFor={`g-${a.id}-${s.id}`}>Score for {s.displayName}</label>
                                  <Input id={`g-${a.id}-${s.id}`} name="score" type="number" min={0} max={a.points ?? undefined} step="0.5" defaultValue={suggested} required className="h-8 w-20" />
                                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="return" /> Return</label>
                                </ActionForm>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Assign in Google Classroom</h2>
        <ul className="space-y-2">
          {curriculum.filter((c) => c.enabled).map((c) => {
            const a = byActivity.get(c.lesson.id);
            const rubric = c.lesson.teacher.rubricId ? getRubric(c.lesson.teacher.rubricId) : null;
            const max = rubric?.criteria.reduce((s, x) => s + x.max, 0);
            return (
              <li key={c.lesson.id} className="rounded-xl border border-border bg-surface">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-3">
                    <span className="font-mono text-xs text-muted">W{c.week}</span>
                    <span className="font-semibold">{c.lesson.title}</span>
                    {a?.status === "published" && <Pill tone="success">Assigned</Pill>}
                    {a?.status === "failed" && <Pill tone="danger">Publish failed</Pill>}
                    {rubric && <Pill tone="accent">Rubric · {max} pts</Pill>}
                  </summary>
                  <div className="border-t border-border p-4">
                    {a?.status === "published" ? (
                      <p className="text-sm">Already assigned{a.googleAlternateLink && <> — <a className="text-primary underline" href={a.googleAlternateLink} target="_blank" rel="noopener noreferrer">open in Classroom</a></>}.</p>
                    ) : course.mapping ? (
                      <ActionForm action={publishAction.bind(null, courseId, c.lesson.id)} submit="Assign in Google Classroom" integration>
                        {a?.lastError && <p className="text-sm text-danger">Last attempt failed: {a.lastError}</p>}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Title" htmlFor={`t-${c.lesson.id}`}><Input id={`t-${c.lesson.id}`} name="title" defaultValue={c.lesson.title} required /></Field>
                          <Field label="Topic" htmlFor={`tp-${c.lesson.id}`}><Input id={`tp-${c.lesson.id}`} name="topic" defaultValue={`Week ${c.week}`} /></Field>
                          <Field label="Points (blank = ungraded)" htmlFor={`p-${c.lesson.id}`}><Input id={`p-${c.lesson.id}`} name="points" type="number" min={0} max={1000} defaultValue={max ?? ""} /></Field>
                          <Field label="Due" htmlFor={`d-${c.lesson.id}`}><Input id={`d-${c.lesson.id}`} name="dueAt" type="datetime-local" defaultValue={c.dueAt ? c.dueAt.toISOString().slice(0, 16) : ""} /></Field>
                          <Field label="Instructions" htmlFor={`i-${c.lesson.id}`} className="sm:col-span-2"><Textarea id={`i-${c.lesson.id}`} name="instructions" defaultValue={c.lesson.summary} /></Field>
                        </div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="autoSync" /> Automatically send the rubric score when I save it</label>
                        <p className="text-xs text-muted">The Classroom post links straight to this mission and its model files.</p>
                      </ActionForm>
                    ) : (
                      <p className="text-sm text-muted">Connect Google Classroom first.</p>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
