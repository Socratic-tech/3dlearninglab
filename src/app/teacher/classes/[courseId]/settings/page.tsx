import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { courseCurriculum, courseRoster, getCourseForTeacher } from "@/server/services/courses";
import { addStudentAction, syncRosterAction, updateCourseAction } from "@/app/actions/teacher";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardTitle, Pill } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { LessonRow } from "@/components/teacher/lesson-toggles";
import { paths } from "@/content";

export default async function ClassSettings(props: PageProps<"/teacher/classes/[courseId]/settings">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId } = await props.params;
  const db = await getDb();
  const course = await guard(getCourseForTeacher(db, actorOf(user), courseId));
  const curriculum = await courseCurriculum(db, course);
  const roster = await courseRoster(db, courseId);
  const eq = course.equipment;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardTitle>Class & equipment</CardTitle>
        <ActionForm action={updateCourseAction.bind(null, courseId)} className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" htmlFor="n"><Input id="n" name="name" defaultValue={course.name} required /></Field>
            <Field label="Section" htmlFor="s"><Input id="s" name="section" defaultValue={course.section ?? ""} /></Field>
            <Field label="Course length" htmlFor="p" className="sm:col-span-2" hint="Switching keeps all student progress; prerequisites follow the chosen path.">
              <Select id="p" name="pathId" defaultValue={course.pathId}>{paths.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select>
            </Field>
            <Field label="Tinkercad Classroom link" htmlFor="t" className="sm:col-span-2" hint="Shows an “Open our Tinkercad Classroom” button in every lesson. Use your school-approved Tinkercad Classroom (with Safe Mode).">
              <Input id="t" name="tinkercadClassUrl" type="url" defaultValue={course.tinkercadClassUrl ?? ""} placeholder="https://www.tinkercad.com/joinclass/…" />
            </Field>
            <Field label="Printers" htmlFor="pc"><Input id="pc" name="printerCount" type="number" min={0} defaultValue={eq.printerCount} /></Field>
            <Field label="Printer models" htmlFor="pm"><Input id="pm" name="printerModels" defaultValue={eq.printerModels} /></Field>
            <Field label="Material" htmlFor="m"><Input id="m" name="material" defaultValue={eq.material} /></Field>
            <Field label="Nozzle (mm)" htmlFor="nz"><Input id="nz" name="nozzleMm" type="number" step="0.05" defaultValue={eq.nozzleMm} /></Field>
            <Field label="Typical layer height (mm)" htmlFor="lh"><Input id="lh" name="layerHeightMm" type="number" step="0.02" defaultValue={eq.layerHeightMm} /></Field>
            <Field label="Student computers" htmlFor="sd">
              <Select id="sd" name="studentDevices" defaultValue={eq.studentDevices}>
                {["chromebook", "windows", "mac", "ipad", "mixed"].map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" name="calipersAvailable" defaultChecked={eq.calipersAvailable} /> Calipers available (otherwise lessons show the ruler-based version)
            </label>
          </div>
        </ActionForm>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardTitle>Google Classroom</CardTitle>
          {course.mapping ? (
            <>
              <p className="mt-1 text-sm">Linked. Last sync: {course.mapping.lastSyncedAt?.toLocaleString() ?? "never"} {course.mapping.lastSyncStatus === "error" && <Pill tone="danger">failed</Pill>}</p>
              {course.mapping.lastSyncError && <p className="text-xs text-muted">Details: {course.mapping.lastSyncError}</p>}
              <ActionForm action={async () => { "use server"; return syncRosterAction(courseId); }} submit="Sync Classroom" className="mt-3" integration variant="secondary" />
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Not linked. Import from Google Classroom to sync the roster and publish assignments.</p>
              <ButtonLink href="/teacher/classroom" className="mt-3" variant="secondary">Connect Google Classroom</ButtonLink>
            </>
          )}
        </Card>
        <Card>
          <CardTitle>Roster ({roster.length})</CardTitle>
          <p className="text-sm text-muted">Students can also join with code <span className="font-mono font-bold">{course.joinCode}</span>.</p>
          <ul className="mt-3 max-h-64 divide-y divide-border overflow-y-auto text-sm">
            {roster.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1.5">
                <a href={`/teacher/classes/${courseId}/students/${s.id}`} className="font-semibold hover:text-primary">{s.displayName}</a>
                <span className="truncate text-muted">{s.email}</span>
                {s.status !== "active" && <Pill tone="warning">{s.status === "not_in_roster" ? "No longer in Classroom roster" : "Archived"}</Pill>}
              </li>
            ))}
          </ul>
          <ActionForm action={addStudentAction.bind(null, courseId)} submit="Add student" className="mt-4" size="sm" variant="secondary">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Name" htmlFor="as-n"><Input id="as-n" name="displayName" required /></Field>
              <Field label="School email" htmlFor="as-e"><Input id="as-e" name="email" type="email" required /></Field>
            </div>
          </ActionForm>
        </Card>
      </div>

      <Card className="xl:col-span-2">
        <CardTitle>Missions in this class</CardTitle>
        <p className="text-sm text-muted">Turn missions on or off, set due dates, or unlock a mission when Tinkercad (or another external tool) is unavailable.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted"><th scope="col">Week</th><th scope="col">Mission</th><th scope="col">Enabled</th><th scope="col">Due</th><th scope="col">Manual unlock</th></tr>
            </thead>
            <tbody>
              {curriculum.map((c) => (
                <LessonRow key={c.lesson.id} courseId={courseId} lessonId={c.lesson.id} title={c.lesson.title} week={c.week} enabled={c.enabled} dueAt={c.dueAt?.toISOString() ?? null} unlocked={c.manuallyUnlocked} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
