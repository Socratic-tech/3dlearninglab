import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { courses, users, lessonProgress, printJobs, evidence } from "@/server/db/schema";
import { orgSettingsAction, setRoleAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "School admin" };

export default async function Admin() {
  const user = await requireUser("org_admin");
  const db = await getDb();
  const org = user.organization;
  const people = await db.select().from(users).where(eq(users.organizationId, org.id)).orderBy(users.role, users.displayName);
  const count = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const n = sql<number>`count(*)::int`;
  const [nCourses, nCompleted, nPrints, nEvidence] = await Promise.all([
    count(db.select({ n }).from(courses).where(eq(courses.organizationId, org.id))),
    count(db.select({ n }).from(lessonProgress).innerJoin(courses, eq(courses.id, lessonProgress.courseId)).where(sql`${courses.organizationId} = ${org.id} and ${lessonProgress.status} = 'completed'`)),
    count(db.select({ n }).from(printJobs).innerJoin(courses, eq(courses.id, printJobs.courseId)).where(eq(courses.organizationId, org.id))),
    count(db.select({ n }).from(evidence).innerJoin(courses, eq(courses.id, evidence.courseId)).where(eq(courses.organizationId, org.id))),
  ]);
  const staff = people.filter((p) => p.role !== "student");
  const students = people.filter((p) => p.role === "student");
  return (
    <>
      <PageHeader eyebrow="School admin" title={org.name} description="Aggregate usage only. Student-level work stays with their teachers unless you opt in below." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Teachers" value={staff.length} /><Stat label="Students" value={students.length} /><Stat label="Classes" value={nCourses} /><Stat label="Missions completed" value={nCompleted} /><Stat label="Prints / evidence" value={`${nPrints} / ${nEvidence}`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Staff</CardTitle>
          <ul className="mt-3 divide-y divide-border text-sm">
            {staff.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2">
                <span className="flex-1"><span className="font-semibold">{p.displayName}</span> <span className="text-muted">{p.email} · {p.role}</span></span>
                {p.id !== user.id && p.role !== "platform_admin" && (
                  <form action={async () => { "use server"; await setRoleAction(p.id, p.role === "teacher" ? "org_admin" : "teacher"); }}>
                    <Button size="sm" variant="ghost">{p.role === "teacher" ? "Make admin" : "Make teacher"}</Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold">Promote a student account to teacher</h3>
          <p className="text-xs text-muted">When staff and students share one Google domain, new sign-ins start as students.</p>
          <ul className="mt-2 max-h-48 divide-y divide-border overflow-y-auto text-sm">
            {students.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-1.5"><span className="flex-1">{p.displayName} <span className="text-muted">{p.email}</span></span>
                <form action={async () => { "use server"; await setRoleAction(p.id, "teacher"); }}><Button size="sm" variant="ghost">Make teacher</Button></form>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Organization settings</CardTitle>
          <ActionForm action={orgSettingsAction} className="mt-3">
            <Field label="Staff Google domain" htmlFor="gd" hint="New sign-ins from this domain start as teachers."><Input id="gd" name="googleDomain" defaultValue={org.googleDomain ?? ""} /></Field>
            <Field label="Student Google domain" htmlFor="sgd" hint="New sign-ins from this domain start as students."><Input id="sgd" name="studentGoogleDomain" defaultValue={org.studentGoogleDomain ?? ""} /></Field>
            <Field label="Max upload size (MB)" htmlFor="mu"><Input id="mu" name="maxUploadMb" type="number" min={1} max={50} defaultValue={org.settings.maxUploadMb ?? 25} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="uploads" defaultChecked={org.settings.studentUploadsEnabled !== false} /> Students may upload files (otherwise design links only)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="adminView" defaultChecked={!!org.settings.adminCanViewStudentWork} /> Admins may view individual student work</label>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
