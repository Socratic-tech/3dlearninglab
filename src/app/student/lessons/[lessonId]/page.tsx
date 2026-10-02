import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { designJournals } from "@/server/db/schema";
import { studentContext } from "@/server/queries/student";
import { openLesson } from "@/server/services/progress";
import { AppError, ForbiddenError, NotFoundError } from "@/server/errors";
import { actorOf } from "@/app/actions/_run";
import { allBlocks, assetsForLesson, competencies, getLesson, journalPrompts } from "@/content";
import { LessonPlayer } from "@/components/lesson/player";
import { Alert, Pill } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata(props: PageProps<"/student/lessons/[lessonId]">): Promise<Metadata> {
  const { lessonId } = await props.params;
  return { title: getLesson(lessonId)?.title ?? "Mission" };
}

const PRINT = { digital: "Digital only", prototype: "Prototype — your teacher decides", required: "Print required" } as const;

export default async function LessonPage(props: PageProps<"/student/lessons/[lessonId]">) {
  const user = await requireUser("student");
  const { lessonId } = await props.params;
  const sp = await props.searchParams;
  const base = getLesson(lessonId);
  if (!base) notFound();
  const ctx = await studentContext(user, typeof sp.course === "string" ? sp.course : null);
  if (!ctx.course) notFound();
  const db = await getDb();
  let data;
  try {
    data = await openLesson(db, actorOf(user), ctx.course.id, lessonId);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    if (e instanceof AppError)
      return (
        <div className="mx-auto max-w-xl space-y-4 py-10">
          <h1 className="font-display text-2xl font-bold">{base.title}</h1>
          <Alert tone="info" title="This mission is still locked">
            {e.userMessage}
          </Alert>
          <ButtonLink href="/student/missions">Back to missions</ButtonLink>
        </div>
      );
    throw e;
  }
  const keys = [...new Set(allBlocks(base).flatMap((b) => (b.type === "journal" ? [b.projectKey] : [])))];
  const journals: Record<string, Record<string, string>> = {};
  for (const k of keys) {
    const [j] = await db
      .select()
      .from(designJournals)
      .where(and(eq(designJournals.studentId, user.id), eq(designJournals.courseId, ctx.course.id), eq(designJournals.projectKey, k)))
      .limit(1);
    journals[k] = j?.entries ?? {};
  }
  const assets = Object.fromEntries(assetsForLesson(base).map((a) => [a.id, a]));
  const progress = ctx.progress.get(lessonId);
  return (
    <article>
      <header className="mx-auto mb-6 max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/student/missions" className="hover:text-fg">
            Missions
          </Link>{" "}
          / {base.domain && <span>Domain {base.domain}</span>}
        </nav>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{base.title} <span className="text-lg font-normal text-muted">· {base.subtitle}</span></h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {base.kind === "boss" && <Pill tone="accent">Boss battle</Pill>}
          <Pill>{base.estimatedMinutes} min</Pill>
          <Pill tone={data.printLevel === "required" ? "warning" : "neutral"}>{PRINT[data.printLevel]}</Pill>
          {data.dueAt && <Pill tone="warning">Due {data.dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Pill>}
          {data.status === "completed" && <Pill tone="success">Completed</Pill>}
        </div>
        {base.vocabulary.length > 0 && (
          <details className="mt-3 inline-block rounded-xl border border-border bg-surface px-3 py-1.5 text-sm open:block open:p-3">
            <summary className="cursor-pointer font-semibold">Key words ({base.vocabulary.length})</summary>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {base.vocabulary.map((v) => (
                <div key={v.term}>
                  <dt className="font-semibold">{v.term}</dt>
                  <dd className="text-muted">{v.definition}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </header>
      <LessonPlayer
        courseId={ctx.course.id}
        lesson={data.lesson}
        entries={data.blockState}
        requiredBlockIds={data.requiredBlockIds}
        evidence={data.evidence.map((e) => ({ id: e.id, type: e.type, fileName: e.fileName, url: e.url, createdAt: e.createdAt.toISOString(), status: e.status, teacherComment: e.teacherComment, teacherRating: e.teacherRating, blockId: e.blockId }))}
        assets={assets}
        competencyTitles={Object.fromEntries(competencies.map((c) => [c.id, c.title]))}
        journalPrompts={journalPrompts}
        journals={journals}
        tinkercadClassUrl={ctx.course.tinkercadClassUrl}
        startedAt={progress?.startedAt?.toISOString() ?? null}
        completed={data.status === "completed"}
      />
    </article>
  );
}
