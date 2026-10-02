import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { modelAssets, getLesson } from "@/content";
import { Card, CardTitle, PageHeader } from "@/components/ui/card";
import { ModelCard } from "@/components/lesson/static-blocks";

export const metadata: Metadata = { title: "Resources" };

export default async function Resources() {
  await requireUser("teacher", "org_admin");
  const originals = modelAssets.filter((a) => a.original);
  const external = modelAssets.filter((a) => !a.original);
  return (
    <>
      <PageHeader title="Resources" description="Every model file used by the curriculum, with license and source. Full credits are on the Attributions page." />
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card><CardTitle>Print Detective kit</CardTitle><p className="mt-1 text-sm">Before week 1, print the samples listed in the <Link href="/teacher/curriculum/print-detective" className="text-primary underline">Print Detective teacher view</Link> and label them Object A–F.</p></Card>
        <Card><CardTitle>Tinkercad Classroom</CardTitle><p className="mt-1 text-sm">Use your school-approved Tinkercad Classroom (teacher-moderated, Safe Mode) and paste its link in each class&apos;s Settings so lessons show “Open our Tinkercad Classroom”. Have students share designs with the class, not publicly.</p></Card>
      </div>
      <h2 className="mb-3 font-display text-xl font-bold">Course models (original, bundled)</h2>
      <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{originals.map((a) => <div key={a.id}><ModelCard a={a} /><p className="mt-1 px-1 text-xs text-muted">Used in: {a.lessonIds.map((l) => getLesson(l)?.title).join(", ")}</p></div>)}</div>
      <h2 className="mb-1 font-display text-xl font-bold">Optional external test models</h2>
      <p className="mb-3 text-sm text-muted">Linked to their source, not bundled, until a platform admin verifies each license.</p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{external.map((a) => <ModelCard key={a.id} a={a} />)}</div>
    </>
  );
}
