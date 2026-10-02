import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { studentContext } from "@/server/queries/student";
import { designJournals, evidence, portfolioItems, competencyHistory } from "@/server/db/schema";
import { badges, getCompetency, getLesson, journalPrompts } from "@/content";
import { Card, CardTitle, EmptyState, PageHeader, Pill } from "@/components/ui/card";
import { LevelChip } from "@/components/ui/level";
import { FeatureToggle } from "@/components/student/print-request";

export const metadata: Metadata = { title: "My Portfolio" };

export default async function Portfolio() {
  const user = await requireUser("student");
  const ctx = await studentContext(user);
  const featuredIds = (await ctx.db.select().from(portfolioItems).where(eq(portfolioItems.studentId, user.id))).map((p) => p.evidenceId);
  const featured = featuredIds.length ? await ctx.db.select().from(evidence).where(inArray(evidence.id, featuredIds)) : [];
  const all = await ctx.db.select().from(evidence).where(eq(evidence.studentId, user.id)).orderBy(desc(evidence.createdAt));
  const challenges = all.filter((e) => ["boss", "challenge", "capstone"].includes(getLesson(e.lessonId)?.kind ?? ""));
  const reflections = all.filter((e) => e.type === "written").slice(0, 6);
  const journals = await ctx.db.select().from(designJournals).where(eq(designJournals.studentId, user.id));
  const history = await ctx.db.select().from(competencyHistory).where(eq(competencyHistory.studentId, user.id)).orderBy(desc(competencyHistory.createdAt)).limit(10);
  const owned = new Set(ctx.badges.map((b) => b.badgeId));
  const item = (e: (typeof all)[number]) => (
    <li key={e.id} className="rounded-xl border border-border bg-surface p-4">
      <p className="font-semibold">{getLesson(e.lessonId)?.title}</p>
      <p className="mt-1 line-clamp-3 text-sm text-muted">{e.url ?? e.fileName ?? e.response}</p>
      {e.teacherComment && <p className="mt-2 text-sm">Teacher: {e.teacherComment}</p>}
      <div className="mt-2">
        <FeatureToggle evidenceId={e.id} featured={featuredIds.includes(e.id)} />
      </div>
    </li>
  );
  return (
    <>
      <PageHeader title="My Portfolio" description="Your best work, how your designs changed, and the skills you've proven. Only you and your teacher can see it." />
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Featured</h2>
          {featured.length ? <ul className="grid gap-3 md:grid-cols-2">{featured.map(item)}</ul> : <EmptyState title="Nothing featured yet">Pick your best pieces with “Feature in portfolio”.</EmptyState>}
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {badges.filter((b) => owned.has(b.id)).map((b) => (
              <Pill key={b.id} tone="accent">★ {b.name}</Pill>
            ))}
            {owned.size === 0 && <p className="text-sm text-muted">Badges appear as you prove skills.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Mastery challenges</h2>
          {challenges.length ? <ul className="grid gap-3 md:grid-cols-2">{challenges.map(item)}</ul> : <p className="text-sm text-muted">Boss battles, CAD ER and your capstone will show here.</p>}
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Design journals</h2>
          {journals.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {journals.map((j) => (
                <Card key={j.id}>
                  <CardTitle as="h3">{j.projectKey === "capstone" ? "Capstone: Design for Someone Else" : j.projectKey === "cad-er" ? "CAD ER" : j.projectKey === "mini-sprint" ? "Mini Design Sprint" : j.projectKey}</CardTitle>
                  <p className="text-xs text-muted">Revision {j.revision} · updated {j.updatedAt.toLocaleDateString()}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    {journalPrompts.filter((p) => j.entries[p.id]).map((p) => (
                      <div key={p.id}>
                        <dt className="font-semibold uppercase tracking-wide">{p.title}</dt>
                        <dd className="whitespace-pre-wrap text-muted">{j.entries[p.id]}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Journals start in CAD ER and the product design missions.</p>
          )}
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-xl font-bold">Reflections</h2>
            <ul className="space-y-2">
              {reflections.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p className="font-semibold">{getLesson(r.lessonId)?.title}</p>
                  <p className="text-muted">{r.response}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-display text-xl font-bold">Recent growth</h2>
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{getCompetency(h.competencyId)?.title}</span>
                  <LevelChip level={h.fromLevel} compact /> → <LevelChip level={h.toLevel} />
                </li>
              ))}
              {history.length === 0 && <li className="text-muted">Your level changes will show here.</li>}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
