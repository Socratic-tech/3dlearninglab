import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { actorOf } from "@/app/actions/_run";
import { isClassroomConnected, listGoogleCourses, usesFakeClassroom } from "@/server/integrations/google/classroom";
import { IntegrationError } from "@/server/errors";
import { importClassroomAction, disconnectGoogleAction } from "@/app/actions/teacher";
import { ActionForm } from "@/components/ui/action-form";
import { Alert, Card, PageHeader, Pill } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { paths } from "@/content";

export const metadata: Metadata = { title: "Google Classroom" };

export default async function ClassroomPage(props: PageProps<"/teacher/classroom">) {
  const user = await requireUser("teacher", "org_admin");
  const db = await getDb();
  const connected = await isClassroomConnected(db, user);
  const fake = usesFakeClassroom(user);
  const sp = await props.searchParams;
  let courses: Awaited<ReturnType<typeof listGoogleCourses>> = [];
  let error: string | null = null;
  if (connected) {
    try {
      courses = await listGoogleCourses(db, actorOf(user));
    } catch (e) {
      error = e instanceof IntegrationError ? e.userMessage : "We couldn't reach Google Classroom.";
    }
  }
  return (
    <>
      <PageHeader title="Google Classroom" description="Import classes and rosters, then publish missions as Classroom assignments. Classroom is an integration — learning here keeps working if it's unavailable." />
      {fake && <div className="mb-4"><Alert tone="warning" title="Simulated Classroom">This server is in demo/development mode, so Google Classroom is simulated and nothing is sent to Google.</Alert></div>}
      {sp.connected && <div className="mb-4"><Alert tone="success">Google Classroom connected.</Alert></div>}
      {!connected ? (
        <Card className="max-w-xl">
          <p>Connect with the Google account you teach with. We request only what&apos;s needed: read your classes and rosters, create assignments and post grades you choose to send.</p>
          <a href="/api/auth/google?intent=classroom" className={buttonClass("primary", "md", "mt-4")}>Connect Google Classroom</a>
        </Card>
      ) : error ? (
        <Alert tone="danger" title="We couldn't load your Google Classroom classes.">Your work in 3D Design Academy is safe. {error} <Link href="/teacher/classroom" className="underline">Try again</Link></Alert>
      ) : (
        <Card>
          <h2 className="font-display text-lg font-bold">Choose classes to connect</h2>
          <ActionForm action={importClassroomAction} submit="Connect selected classes" integration className="mt-3">
            <ul className="divide-y divide-border">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  {c.linkedLocalCourseId ? (
                    <>
                      <Pill tone="success">Connected</Pill>
                      <Link href={`/teacher/classes/${c.linkedLocalCourseId}`} className="font-semibold hover:text-primary">{c.name}{c.section && ` · ${c.section}`}</Link>
                    </>
                  ) : (
                    <label className="flex items-center gap-3 font-semibold">
                      <input type="checkbox" name="googleCourseId" value={c.id} className="size-4" /> {c.name}{c.section && ` · ${c.section}`}
                    </label>
                  )}
                </li>
              ))}
              {courses.length === 0 && <li className="py-2 text-muted">No active classes where you are a teacher.</li>}
            </ul>
            <Field label="Course length for new classes" htmlFor="pathId" className="max-w-sm">
              <Select id="pathId" name="pathId" defaultValue="18-week">{paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select>
            </Field>
          </ActionForm>
          {!fake && (
            <form action={async () => { "use server"; await disconnectGoogleAction(); }} className="mt-6 border-t border-border pt-4">
              <button className="text-sm text-muted underline">Disconnect Google (revokes our access; your classes and student work stay here)</button>
            </form>
          )}
        </Card>
      )}
    </>
  );
}
