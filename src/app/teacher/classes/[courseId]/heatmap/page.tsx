import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { heatmap } from "@/server/services/dashboard";
import { LevelCell, LevelLegend } from "@/components/ui/level";
import { LEVEL_LABEL } from "@/lib/mastery";

export default async function Heatmap(props: PageProps<"/teacher/classes/[courseId]/heatmap">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId } = await props.params;
  const mode = (await props.searchParams).view === "all" ? "competencies" : "groups";
  const { columns, rows } = await guard(heatmap(await getDb(), actorOf(user), courseId, mode));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <LevelLegend />
        <div className="flex gap-1 text-sm" role="group" aria-label="Columns">
          <Link href="?view=groups" aria-current={mode === "groups" ? "true" : undefined} className="rounded-lg border border-border px-3 py-1 aria-[current=true]:bg-primary aria-[current=true]:text-primary-fg">Skill groups</Link>
          <Link href="?view=all" aria-current={mode === "competencies" ? "true" : undefined} className="rounded-lg border border-border px-3 py-1 aria-[current=true]:bg-primary aria-[current=true]:text-primary-fg">All competencies</Link>
        </div>
      </div>
      <p className="mb-3 text-sm text-muted">Select a cell to see the evidence behind it and change the level.</p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full border-separate border-spacing-1 p-2 text-sm">
          <caption className="sr-only">Class skill heatmap</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface px-2 text-left">Student</th>
              {columns.map((c) => (
                <th key={c.id} scope="col" className="h-28 min-w-11 align-bottom">
                  <span className="inline-block max-w-28 origin-bottom-left translate-x-4 -rotate-45 whitespace-nowrap text-left text-xs font-semibold">{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student.id}>
                <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-surface px-2 text-left font-semibold">
                  {r.student.name}
                  {r.student.status === "not_in_roster" && <span className="block text-xs font-normal text-warning">No longer in Classroom roster</span>}
                </th>
                {r.cells.map((cell, i) => (
                  <td key={cell.columnId}>
                    <Link href={`/teacher/classes/${courseId}/students/${r.student.id}?focus=${columns[i].competencyIds.join(",")}#competencies`} aria-label={`${r.student.name}, ${columns[i].label}: ${LEVEL_LABEL[cell.level]}`} className="block rounded-md focus-visible:ring-2">
                      <LevelCell level={cell.level} />
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
