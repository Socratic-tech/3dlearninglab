import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { badges, competencies, lessons, modelAssets, standards, validateCurriculum } from "@/content";
import { Alert, Card, CardTitle, PageHeader, Pill, Stat } from "@/components/ui/card";

export const metadata: Metadata = { title: "Platform" };

export default async function Platform() {
  await requireUser("platform_admin");
  const problems = validateCurriculum();
  return (
    <>
      <PageHeader eyebrow="Platform admin" title="Curriculum & assets" description="Curriculum is versioned content in src/content (see docs/content-authoring.md). Changes ship through a reviewed release; this page validates what is deployed." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Lessons" value={lessons.length} /><Stat label="Competencies" value={competencies.length} /><Stat label="Badges" value={badges.length} /><Stat label="Standards" value={standards.length} /><Stat label="Model assets" value={modelAssets.length} />
      </div>
      {problems.length ? <Alert tone="danger" title={`${problems.length} curriculum problems`}><ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul></Alert> : <Alert tone="success" title="Curriculum validates: every reference resolves." />}
      <Card className="mt-6">
        <CardTitle>Model licenses</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted"><th scope="col">Asset</th><th scope="col">Creator</th><th scope="col">License</th><th scope="col">Verified</th><th scope="col">Bundled</th></tr></thead>
            <tbody>{modelAssets.map((a) => (
              <tr key={a.id} className="border-t border-border"><th scope="row" className="py-1.5 text-left">{a.title}</th><td>{a.creator}</td><td>{a.license}</td><td>{a.sourceVerifiedAt ?? <Pill tone="warning">Needs verification</Pill>}</td><td>{a.localFilePath ? "Yes" : "Link-out"}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">To bundle an external model: confirm its license on the source page, save the file under public/models/external/, set localFilePath and sourceVerifiedAt in src/content/models.ts.</p>
      </Card>
    </>
  );
}
