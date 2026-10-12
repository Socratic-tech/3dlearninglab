import { Card, CardTitle } from "@/components/ui/card";
import type { Me } from "../content";
import { SetupCheckPanel, StressTestPanel } from "./SetupHelp";

/**
 * Hidden tools page for teachers (#/debug): versions, Check my setup and the classroom stress test.
 * Not linked from the dashboard so day-to-day screens stay simple.
 */
export function DebugPage({ me, apiUrl }: { me: Me; apiUrl: string }) {
  const app = me.app;
  const rows: [string, string][] = [
    ["Signed in as", me.user.email],
    ["Sheet app version", app?.version ?? "unknown"],
    ["Lessons version", app?.content ?? "unknown"],
    ["Sheet owner", app?.owner ?? "unknown"],
    ["Installs updates safely", app ? (app.safeUpdates ? "yes" : "no") : "unknown"],
    ["Web app address", apiUrl],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <a href="#/teacher" className="text-sm text-muted hover:text-fg">← Teacher dashboard</a>
        <h1 className="mt-2 font-display text-3xl font-bold">Tools</h1>
        <p className="text-muted">Behind-the-scenes checks. Nothing here changes your students’ work.</p>
      </div>
      <Card>
        <CardTitle>This copy</CardTitle>
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          {rows.map(([k, v]) => <div key={k} className="contents"><dt className="font-semibold">{k}</dt><dd className="break-all text-muted">{v}</dd></div>)}
        </dl>
      </Card>
      <Card>
        <CardTitle>Classroom stress test</CardTitle>
        <p className="mt-1 text-sm text-muted">See how fast your Sheet answers when a whole class opens the app at once. Uses test students, never real ones.</p>
        <div className="mt-3"><StressTestPanel apiUrl={apiUrl} /></div>
      </Card>
      <Card>
        <CardTitle>Check my setup</CardTitle>
        <div className="mt-3"><SetupCheckPanel apiUrl={apiUrl} classId={me.cls?.id} /></div>
      </Card>
    </div>
  );
}
