import type { Metadata } from "next";
import * as Icons from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { studentContext } from "@/server/queries/student";
import { badges, competenciesInDomain, domains, lessons } from "@/content";
import { Card, PageHeader } from "@/components/ui/card";
import { LevelChip, LevelLegend } from "@/components/ui/level";
import { meetsLevel } from "@/lib/mastery";
import { cn } from "@/lib/cn";
import Link from "next/link";

export const metadata: Metadata = { title: "Skill Tree" };

const STAGE: Record<string, string> = { follow: "Follow", modify: "Modify", combine: "Combine", solve: "Solve", design: "Design" };

export default async function Skills() {
  const user = await requireUser("student");
  const ctx = await studentContext(user);
  const owned = new Map(ctx.badges.map((b) => [b.badgeId, b.awardedAt]));
  const lv = (id: string) => ctx.levels.get(id)?.level ?? "not_attempted";
  const lessonFor = (c: string) => lessons.find((l) => l.competencyIds.includes(c));
  return (
    <>
      <PageHeader title="Skill Tree" description="Each skill grows from evidence: skill checks, designs your teacher reviews, and challenges. Early tries never count against you." actions={<LevelLegend />} />
      <section aria-labelledby="badges-h" className="mb-8">
        <h2 id="badges-h" className="mb-3 font-display text-xl font-bold">Badges</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => {
            const Icon = (Icons[b.icon.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join("") as keyof typeof Icons] ?? Icons.Award) as React.ComponentType<{ className?: string }>;
            const earned = owned.has(b.id);
            const progress = b.requires.filter((c) => meetsLevel(lv(c), b.minLevel)).length;
            return (
              <li key={b.id} className={cn("rounded-2xl border p-4", earned ? "animate-unlock border-accent bg-accent-soft" : "border-border bg-surface")}>
                <Icon className={cn("size-7", earned ? "text-accent" : "text-muted")} aria-hidden />
                <p className="mt-2 font-semibold">{b.name}</p>
                <p className="text-xs text-muted">{b.description}</p>
                <p className="mt-2 text-xs font-semibold">{earned ? "Earned" : `${progress} / ${b.requires.length} skills`}</p>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        {domains.map((d) => (
          <Card key={d.id}>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Domain {d.id}</p>
            <h2 className="font-display text-lg font-bold">{d.title}</h2>
            <p className="text-sm text-muted">{d.description}</p>
            <ul className="mt-3 divide-y divide-border">
              {competenciesInDomain(d.id).map((c) => {
                const l = lessonFor(c.id);
                return (
                  <li key={c.id} className="flex items-center gap-3 py-2">
                    <span className="w-8 font-mono text-xs text-muted">{c.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{c.title}</span>
                      <span className="block text-xs text-muted">
                        {c.canStatement} · {STAGE[c.stage]}
                        {l && (
                          <>
                            {" · "}
                            <Link href={`/student/lessons/${l.id}`} className="text-primary underline">
                              Practise
                            </Link>
                          </>
                        )}
                      </span>
                    </span>
                    <LevelChip level={lv(c.id)} />
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
