import { useMemo } from "react";
import { Printer } from "lucide-react";
import { offlineChallenges } from "./HandoutPage";
import { LessonPlayer } from "@/components/lesson/player";
import { Alert, Pill } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import type { BlockEntry } from "@/components/lesson/types";
import { allBlocks, isRequiredBlock } from "@/content/schema";
import { assetsFor, competencyTitle, journalPrompts, lessonById, type Me } from "../content";
import { googleLessonApi } from "../api";
import { studentStates } from "../state";

export function LessonPage({ me, apiUrl, lessonId, focusBlockId, onChange }: { me: Me; apiUrl: string; lessonId: string; focusBlockId?: string; onChange: () => void }) {
  const lesson = lessonById.get(lessonId);
  const api = useMemo(() => googleLessonApi(apiUrl, onChange), [apiUrl, onChange]);
  if (!lesson) return <Alert tone="warning" title="That mission doesn't exist." />;
  const { states } = studentStates(me);
  const st = states.get(lessonId);
  if (me.user.role === "student" && (!st || st === "locked")) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10">
        <h1 className="font-display text-2xl font-bold">{lesson.title}</h1>
        <Alert tone="info" title="This mission is still locked">Finish the missions before it first — then it unlocks.</Alert>
        <a href="#/" className={buttonClass()}>Back to missions</a>
      </div>
    );
  }
  const p = me.progress[lessonId];
  const preview = me.user.role !== "student";
  const evidence = me.evidence.filter((e) => e.lessonId === lessonId).map((e) => ({ id: e.id, type: e.type, fileName: e.fileName, url: e.url, createdAt: e.createdAt, status: e.status, teacherComment: e.comment, teacherRating: e.rating, blockId: e.blockId }));
  return (
    <article>
      <header className="mx-auto mb-6 max-w-3xl">
        {preview && <div className="mb-3"><Alert tone="info" title="Teacher preview">Try every activity like a student. Your answers go to your own test record, not to any class.</Alert></div>}
        <a href="#/" className="text-sm text-muted hover:text-fg">← Missions</a>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{lesson.title} <span className="text-lg font-normal text-muted">· {lesson.subtitle}</span></h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {lesson.kind === "boss" && <Pill tone="accent">Boss battle</Pill>}
          <Pill>{lesson.estimatedMinutes} min</Pill>
          {p?.status === "completed" && <Pill tone="success">Completed</Pill>}
          {offlineChallenges(lesson).length > 0 && (
            <a href={`#/print/${lesson.id}`} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-0.5 text-sm font-semibold hover:bg-surface-2">
              <Printer className="size-4" aria-hidden /> Print handout
            </a>
          )}
        </div>
      </header>
      <LessonPlayer
        key={lessonId}
        courseId="class"
        lesson={lesson}
        entries={(p?.blockState ?? {}) as Record<string, BlockEntry>}
        requiredBlockIds={allBlocks(lesson).filter(isRequiredBlock).map((b) => b.id)}
        evidence={evidence}
        assets={assetsFor(lesson)}
        competencyTitles={competencyTitle}
        journalPrompts={journalPrompts}
        journals={me.journals}
        tinkercadClassUrl={me.cls?.tinkercadUrl ?? null}
        startedAt={p?.startedAt ?? null}
        completed={p?.status === "completed"}
        readOnly={false}
        bottomNav={false}
        freeNav={preview}
        focusBlockId={focusBlockId}
        api={api}
        links={{ lesson: (id) => `#/lesson/${id}`, missions: "#/" }}
      />
    </article>
  );
}
