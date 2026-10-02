import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { createCourseAction } from "@/app/actions/teacher";
import { ActionForm } from "@/components/ui/action-form";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { paths } from "@/content";

export const metadata: Metadata = { title: "New class" };

export default async function NewClass() {
  await requireUser("teacher", "org_admin");
  return (
    <>
      <PageHeader title="New class" description="Students join with a code, or import the roster later from Google Classroom." />
      <Card className="max-w-xl">
        <ActionForm action={createCourseAction} submit="Create class">
          <Field label="Class name" htmlFor="name"><Input id="name" name="name" required placeholder="3D Design" /></Field>
          <Field label="Section / period" htmlFor="section"><Input id="section" name="section" placeholder="Period 2" /></Field>
          <Field label="Course length" htmlFor="pathId">
            <Select id="pathId" name="pathId" defaultValue="18-week">
              {paths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </Field>
        </ActionForm>
      </Card>
    </>
  );
}
