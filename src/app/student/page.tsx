import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Award, Box, FolderOpen, Network } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { studentContext } from "@/server/queries/student";
import { teacherFeedback, users } from "@/server/db/schema";
import { summarize } from "@/lib/student-summary";
import { getCompetency, getLesson } from "@/content";
import { Card, CardTitle, Pill } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { JoinClassCard } from "@/components/student/join-class";

export const metadata: Metadata = { title: "Home" };

export default async function StudentHome() {
  const user = await requireUser("student");
  const ctx = await studentContext(user);
  const first = user.displayName.split(" ")[0];
  if (!ctx.course) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-bold">Welcome, {first}</h1>
        <p className="mt-1 text-muted">Join your class to see your missions.</p>
        <div className="mt-6">
          <JoinClassCard />
        </div>
      </div>
    );
  }
  const owned = new Set(ctx.badges.map((b) => b.badgeId));
  const sum = summarize({ curriculum: ctx.curriculum, states: ctx.states, levels: ctx.levels, ownedBadges: owned });
  const feedback = await ctx.db
    .select({ f: teacherFeedback, author: users.displayName })
    .from(teacherFeedback)
    .innerJoin(users, eq(users.id, teacherFeedback.authorId))
    .where(eq(teacherFeedback.studentId, user.id))
    .orderBy(desc(teacherFeedback.createdAt))
    .limit(3);
  const due = ctx.curriculum
    .filter((c) => c.dueAt && ctx.states?.get(c.lesson.id) !== "completed" && c.dueAt.getTime() > Date.now() - 864e5 * 7)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime())
    .slice(0, 3);
  const pct = sum.total ? Math.round((sum.mastered / sum.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="bg-blueprint overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{first}</h1>
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <ProgressRing value={pct} size={112} stroke={10} label="Skills mastered" />
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Designer level</dt>
              <dd className="font-display text-3xl font-bold">{sum.designerLevel}</dd>
              <p className="text-xs text-muted">Grows as you complete missions and show new skills.</p>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Skills mastered</dt>
              <dd className="font-display text-3xl font-bold">
                {sum.mastered} <span className="text-lg text-muted">/ {sum.total}</span>
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Missions complete</dt>
              <dd className="font-display text-3xl font-bold">
                {sum.completedCount} <span className="text-lg text-muted">/ {ctx.curriculum.length}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current mission</p>
          {sum.current ? (
            <>
              <h2 className="mt-1 font-display text-2xl font-bold">{sum.current.lesson.title}</h2>
              <p className="text-muted">{sum.current.lesson.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="primary">Week {sum.current.week}</Pill>
                <Pill>{sum.current.lesson.estimatedMinutes} min</Pill>
                {sum.current.lesson.kind === "boss" && <Pill tone="accent">Boss Battle</Pill>}
                {sum.current.dueAt && <Pill tone="warning">Due {sum.current.dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Pill>}
              </div>
              <div className="mt-auto pt-5">
                <ButtonLink href={`/student/lessons/${sum.current.lesson.id}`} size="lg">
                  Continue mission <ArrowRight className="size-5" aria-hidden />
                </ButtonLink>
              </div>
            </>
          ) : (
            <p className="mt-2 text-muted">Every mission is complete. Revisit any skill from the Skill Tree to level it up.</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Next unlock</p>
          {sum.nextBadge ? (
            <>
              <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-bold">
                <Award className="size-5 text-accent" aria-hidden /> {sum.nextBadge.badge.name}
              </h2>
              <p className="text-sm text-muted">{sum.nextBadge.badge.description}</p>
              {sum.nextBadge.missing.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-semibold">Still to prove:</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {sum.nextBadge.missing.slice(0, 4).map((c) => {
                      const skill = getCompetency(c);
                      return <li key={c}>{skill?.canStatement ?? skill?.title ?? "Show this skill"}</li>;
                    })}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="mt-2 text-muted">You&apos;ve earned every badge. Impressive.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Progress by domain</CardTitle>
        <ul className="mt-4 space-y-3">
          {sum.domainBars.map((d) => (
            <li key={d.domain.id} className="grid grid-cols-[minmax(8rem,12rem)_1fr_3rem] items-center gap-3">
              <span className="truncate text-sm font-semibold">{d.domain.title}</span>
              <ProgressBar value={d.value} label={`${d.domain.title} mastery`} />
              <span className="text-right font-mono text-sm text-muted">{d.value}%</span>
            </li>
          ))}
        </ul>
      </Card>

      <nav aria-label="Quick links" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: sum.current ? `/student/lessons/${sum.current.lesson.id}` : "/student/missions", label: "Continue Mission", icon: ArrowRight },
          { href: "/student/skills", label: "Skill Tree", icon: Network },
          { href: "/student/designs", label: "My Designs", icon: Box },
          { href: "/student/portfolio", label: "My Portfolio", icon: FolderOpen },
        ].map((q) => (
          <Link key={q.label} href={q.href} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 font-semibold hover:border-primary">
            <q.icon className="size-5 text-primary" aria-hidden /> {q.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Teacher feedback</CardTitle>
          {feedback.length ? (
            <ul className="mt-3 space-y-3">
              {feedback.map(({ f, author }) => (
                <li key={f.id} className="rounded-lg bg-surface-2 p-3 text-sm">
                  <p>{f.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {author}
                    {f.lessonId ? ` · ${getLesson(f.lessonId)?.title}` : ""}
                    {f.lessonId && (
                      <>
                        {" · "}
                        <Link href={`/student/lessons/${f.lessonId}`} className="text-primary underline">
                          Open
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No feedback yet.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Coming up</CardTitle>
          {due.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {due.map((d) => (
                <li key={d.lesson.id} className="flex items-center justify-between gap-2">
                  <Link href={`/student/lessons/${d.lesson.id}`} className="font-semibold hover:text-primary">
                    {d.lesson.title}
                  </Link>
                  <span className="text-muted">{d.dueAt!.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Nothing due right now.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
