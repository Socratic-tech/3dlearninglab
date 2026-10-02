import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { assertCanReviewInCourse } from "@/server/policy";
import { designJournals, enrollments, rubricScores, users } from "@/server/db/schema";
import { getStudentLevels } from "@/server/services/mastery";
import { evidenceForStudent } from "@/server/services/evidence";
import { getCourseForTeacher, studentLessonStates } from "@/server/services/courses";
import { allBlocks, competencies, domains, getLesson, getRubric, journalPrompts, PROFICIENCY_LEVELS } from "@/content";
import { LEVEL_LABEL } from "@/lib/mastery";
import { overrideAction, observationAction, rubricAction, enrollmentAction } from "@/app/actions/teacher";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardTitle, Pill } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { LevelChip } from "@/components/ui/level";
import { EvidenceReviewCard } from "@/components/teacher/evidence-review";
import { Button } from "@/components/ui/button";

export default async function StudentDetail(props: PageProps<"/teacher/classes/[courseId]/students/[studentId]">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId, studentId } = await props.params;
  const focus = String((await props.searchParams).focus ?? "").split(",").filter(Boolean);
  const db = await getDb();
  const actor = actorOf(user);
  await guard(assertCanReviewInCourse(db, actor, courseId, studentId));
  const course = await getCourseForTeacher(db, actor, courseId);
  const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
  if (!student) notFound();
  const [enr] = await db.select().from(enrollments).where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, studentId)));
  const levels = await getStudentLevels(db, studentId);
  const ev = await evidenceForStudent(db, actor, studentId, { courseId });
  const { curriculum, states } = await studentLessonStates(db, studentId, course);
  const scores = await db.select().from(rubricScores).where(and(eq(rubricScores.studentId, studentId), eq(rubricScores.courseId, courseId)));
  const journals = await db.select().from(designJournals).where(and(eq(designJournals.studentId, studentId), eq(designJournals.courseId, courseId)));
  const rubricLessons = curriculum.filter((c) => c.lesson.teacher.rubricId);
  const checks = curriculum.flatMap((c) => allBlocks(c.lesson).filter((b) => b.type === "teacherCheck").map((b) => ({ lesson: c.lesson, block: b as Extract<typeof b, { type: "teacherCheck" }> })));
  const done = curriculum.filter((c) => states.get(c.lesson.id) === "completed").length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold">{student.displayName}</h2>
        <Pill>{done}/{curriculum.length} missions</Pill>
        {enr?.status === "not_in_roster" && <Pill tone="warning">No longer in Classroom roster</Pill>}
        {enr?.status === "archived" && <Pill>Archived</Pill>}
        <form action={async () => { "use server"; await enrollmentAction(courseId, studentId, enr?.status === "archived" ? "active" : "archived"); }} className="ml-auto">
          <Button size="sm" variant="secondary">{enr?.status === "archived" ? "Restore to class" : "Archive from class"}</Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card id="competencies">
          <CardTitle>Competencies</CardTitle>
          <div className="mt-3 max-h-[32rem] space-y-4 overflow-y-auto pr-2">
            {domains.map((d) => (
              <div key={d.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{d.title}</p>
                <ul className="mt-1">
                  {competencies.filter((c) => c.domain === d.id).map((c) => {
                    const row = levels.get(c.id);
                    return (
                      <li key={c.id} className={`flex items-center gap-2 rounded px-1 py-1 text-sm ${focus.includes(c.id) ? "bg-accent-soft" : ""}`}>
                        <span className="w-8 font-mono text-xs text-muted">{c.id}</span>
                        <span className="flex-1">{c.title}{row?.row.overrideLevel && <span className="text-xs text-muted"> (teacher set{row.row.overrideComment ? `: ${row.row.overrideComment}` : ""})</span>}</span>
                        <LevelChip level={row?.level ?? "not_attempted"} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardTitle>Change proficiency</CardTitle>
            <p className="text-sm text-muted">Overrides are logged. New evidence can still raise the level later.</p>
            <ActionForm action={overrideAction.bind(null, courseId, studentId)} submit="Change proficiency" className="mt-3">
              <Field label="Competency" htmlFor="ov-c">
                <Select id="ov-c" name="competencyId" defaultValue={focus[0] ?? "A1"}>
                  {competencies.map((c) => <option key={c.id} value={c.id}>{c.id} {c.title}</option>)}
                </Select>
              </Field>
              <Field label="Level" htmlFor="ov-l">
                <Select id="ov-l" name="level" defaultValue="proficient">
                  {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                </Select>
              </Field>
              <Field label="Comment (optional)" htmlFor="ov-m"><Input id="ov-m" name="comment" maxLength={500} placeholder="Showed me at the bench" /></Field>
            </ActionForm>
          </Card>
          {checks.length > 0 && (
            <Card>
              <CardTitle>Record a teacher check</CardTitle>
              <ActionForm action={observationAction.bind(null, courseId, studentId)} submit="Record" className="mt-3">
                <Field label="Check" htmlFor="ob-b">
                  <Select id="ob-b" name="check">
                    {checks.map(({ lesson, block }) => <option key={`${lesson.id}/${block.id}`} value={`${lesson.id}|${block.id}|${block.competencyIds.join(",")}`}>{lesson.title}: {block.prompt.slice(0, 60)}</option>)}
                  </Select>
                </Field>
                <Field label="Rating" htmlFor="ob-r">
                  <Select id="ob-r" name="rating" defaultValue="2">
                    <option value="1">I · Developing</option><option value="2">II · Proficient</option><option value="3">III · Independent</option>
                  </Select>
                </Field>
                <Field label="Note" htmlFor="ob-n"><Input id="ob-n" name="comment" /></Field>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>

      {rubricLessons.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-xl font-bold">Rubric scoring</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {rubricLessons.map(({ lesson }) => {
              const rubric = getRubric(lesson.teacher.rubricId!)!;
              const saved = scores.find((s) => s.lessonId === lesson.id);
              return (
                <Card key={lesson.id}>
                  <CardTitle as="h4">{lesson.title}</CardTitle>
                  <p className="text-sm text-muted">{rubric.title}{saved && ` · saved ${saved.total}/${saved.max}`}</p>
                  <ActionForm action={rubricAction.bind(null, courseId, studentId, lesson.id, rubric.id)} submit="Save rubric" className="mt-3" size="sm">
                    {rubric.criteria.map((c) => (
                      <Field key={c.id} label={`${c.label} (0–${c.max})`} htmlFor={`r-${lesson.id}-${c.id}`} hint={c.descriptors[0]}>
                        <Select id={`r-${lesson.id}-${c.id}`} name={`c_${c.id}`} defaultValue={String(saved?.scores[c.id] ?? "")} required>
                          <option value="" disabled>Score…</option>
                          {Array.from({ length: c.max + 1 }, (_, i) => <option key={i} value={i}>{i}{i > 0 && i <= 4 ? ` — ${c.descriptors[4 - i]?.slice(0, 50) ?? ""}` : ""}</option>)}
                        </Select>
                      </Field>
                    ))}
                    <Field label="Comment" htmlFor={`rc-${lesson.id}`}><Textarea id={`rc-${lesson.id}`} name="comment" defaultValue={saved?.comment ?? ""} className="min-h-16" /></Field>
                  </ActionForm>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-display text-xl font-bold">Evidence ({ev.length})</h3>
        <ul className="space-y-3">
          {ev.filter((e) => !focus.length || e.competencyIds.some((c) => focus.includes(c))).map((e) => (
            <li key={e.id}>
              <EvidenceReviewCard courseId={courseId} e={{ ...e, createdAt: e.createdAt.toISOString() }} header={<span className="font-semibold">{getLesson(e.lessonId)?.title}</span>} />
            </li>
          ))}
        </ul>
        {focus.length > 0 && <a href="?" className="mt-2 inline-block text-sm text-primary underline">Show all evidence</a>}
      </section>

      {journals.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-xl font-bold">Design journals</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {journals.map((j) => (
              <Card key={j.id}>
                <CardTitle as="h4">{j.projectKey}</CardTitle>
                <dl className="mt-2 space-y-2 text-sm">
                  {journalPrompts.filter((p) => j.entries[p.id]).map((p) => (
                    <div key={p.id}><dt className="font-semibold">{p.title}</dt><dd className="whitespace-pre-wrap text-muted">{j.entries[p.id]}</dd></div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
