import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { attempts, courses, evidence, lessonProgress, type BlockState } from "../db/schema";
import { allBlocks, getCompetency, isRequiredBlock, type Lesson, type LessonBlock } from "@/content";
import { autoLevel } from "@/lib/mastery";
import { isScorable, redactBlock, scoreBlock, REVEAL_AFTER_ATTEMPTS, type BlockResponse, type ScoreResult } from "@/lib/scoring";
import { assertStudentInCourse, type Actor } from "../policy";
import { AppError, ForbiddenError, NotFoundError } from "../errors";
import { studentLessonStates, lessonFor, type Course } from "./courses";
import { recordCompetencyEvidence } from "./mastery";
import { getLesson } from "@/content";

export type BlockEntry = BlockState[string] & {
  done?: boolean;
  result?: ClientResult;
};

/** What the browser is allowed to know about a scored response. */
export type ClientResult = {
  correct: boolean | null;
  headline: string;
  feedback?: string;
  explanation?: string;
  reveal: Record<string, unknown>;
  locked: boolean;
  attempts: number;
};

async function getCourse(db: DB, courseId: string): Promise<Course> {
  const [c] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!c) throw new NotFoundError("Class");
  return c;
}

/** Throws unless the student may open this lesson now. */
async function assertLessonOpen(db: DB, actor: Actor, courseId: string, lessonId: string) {
  await assertStudentInCourse(db, actor, courseId);
  const course = await getCourse(db, courseId);
  const { states, curriculum } = await studentLessonStates(db, actor.id, course);
  const state = states.get(lessonId);
  if (!state) throw new ForbiddenError({ reason: "lesson not in course", lessonId });
  if (state === "locked") {
    const entry = curriculum.find((c) => c.lesson.id === lessonId)!;
    const missing = entry.lesson.prerequisites.filter((p) => states.get(p) && states.get(p) !== "completed").map((p) => getLesson(p)?.title ?? p);
    throw new AppError(`Finish ${missing.join(" and ")} first — then this mission unlocks.`, 403);
  }
  return { course, state, entry: curriculum.find((c) => c.lesson.id === lessonId)! };
}

async function ensureProgressRow(db: DB, studentId: string, courseId: string, lessonId: string) {
  const now = new Date();
  await db
    .insert(lessonProgress)
    .values({ studentId, courseId, lessonId, status: "in_progress", startedAt: now, lastActivityAt: now })
    .onConflictDoUpdate({
      target: [lessonProgress.studentId, lessonProgress.courseId, lessonProgress.lessonId],
      set: {
        lastActivityAt: now,
        status: sql`CASE WHEN ${lessonProgress.status} = 'not_started' THEN 'in_progress'::lesson_status ELSE ${lessonProgress.status} END`,
        startedAt: sql`COALESCE(${lessonProgress.startedAt}, ${now})`,
      },
    });
}

async function readProgress(db: DB, studentId: string, courseId: string, lessonId: string) {
  const [row] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.courseId, courseId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);
  return row;
}

/** Atomically merge one block's entry into block_state (safe under concurrent saves from several tabs). */
async function mergeBlock(db: DB, studentId: string, courseId: string, lessonId: string, blockId: string, entry: BlockEntry) {
  await db
    .update(lessonProgress)
    .set({
      blockState: sql`${lessonProgress.blockState} || ${JSON.stringify({ [blockId]: { ...entry, updatedAt: new Date().toISOString() } })}::jsonb`,
      lastActivityAt: new Date(),
    })
    .where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.courseId, courseId), eq(lessonProgress.lessonId, lessonId)));
}

function findBlock(lesson: Lesson, blockId: string): LessonBlock {
  const b = allBlocks(lesson).find((x) => x.id === blockId);
  if (!b) throw new NotFoundError("Activity");
  return b;
}

function toClient(block: LessonBlock, score: ScoreResult, attemptsSoFar: number): ClientResult {
  const locked = block.type === "prediction" || score.correct === true || score.correct === null;
  const showExplanation = locked || attemptsSoFar >= REVEAL_AFTER_ATTEMPTS;
  let reveal = score.reveal;
  let explanation = showExplanation ? score.explanation || undefined : undefined;
  if (showExplanation && score.correct === false) {
    // after several tries, show the worked answer too
    const full = scoreBlockAnswerKey(block);
    reveal = { ...reveal, ...full.reveal };
    explanation = full.explanation;
  }
  return { correct: score.correct, headline: score.headline, feedback: score.feedback, explanation, reveal, locked, attempts: attemptsSoFar };
}

/** The answer key, revealed only after enough attempts. */
function scoreBlockAnswerKey(block: LessonBlock): { explanation: string; reveal: Record<string, unknown> } {
  switch (block.type) {
    case "multipleChoice":
      return { explanation: block.explanation, reveal: { correctOptionIds: block.correctOptionIds } };
    case "ordering":
      return { explanation: block.explanation, reveal: { order: block.items.map((i) => i.id) } };
    case "matching":
      return { explanation: block.explanation, reveal: { correctPairIds: block.pairs.map((p) => p.id), solved: true } };
    case "hotspot":
      return { explanation: block.explanation, reveal: { revealedIds: block.hotspots.filter((h) => h.correct).map((h) => h.id) } };
    case "measurement":
      return { explanation: block.explanation, reveal: { answer: block.answer } };
    default:
      return { explanation: "", reveal: {} };
  }
}

// ───────── Public API ─────────

export async function openLesson(db: DB, actor: Actor, courseId: string, lessonId: string) {
  const { course, entry } = await assertLessonOpen(db, actor, courseId, lessonId);
  const lesson = entry.lesson;
  await ensureProgressRow(db, actor.id, courseId, lessonId);
  const row = await readProgress(db, actor.id, courseId, lessonId);
  const redacted: Lesson = { ...lesson, sections: lesson.sections.map((s) => ({ ...s, blocks: s.blocks.map(redactBlock) })) };
  const evidenceRows = await db
    .select()
    .from(evidence)
    .where(and(eq(evidence.studentId, actor.id), eq(evidence.courseId, courseId), eq(evidence.lessonId, lessonId)));
  return {
    course,
    lesson: redacted,
    teacherGuideHidden: true,
    blockState: (row?.blockState ?? {}) as Record<string, BlockEntry>,
    status: row?.status ?? "in_progress",
    completedAt: row?.completedAt ?? null,
    evidence: evidenceRows,
    printLevel: entry.printLevel,
    dueAt: entry.dueAt,
    requiredBlockIds: allBlocks(lesson).filter(isRequiredBlock).map((b) => b.id),
  };
}

export async function answerBlock(db: DB, actor: Actor, input: { courseId: string; lessonId: string; blockId: string; response: BlockResponse }): Promise<ClientResult> {
  await assertLessonOpen(db, actor, input.courseId, input.lessonId);
  const lesson = lessonFor(input.lessonId);
  const block = findBlock(lesson, input.blockId);
  if (!isScorable(block)) throw new AppError("That activity doesn't take answers.");
  await ensureProgressRow(db, actor.id, input.courseId, input.lessonId);
  const row = await readProgress(db, actor.id, input.courseId, input.lessonId);
  const prev = (row?.blockState?.[block.id] ?? {}) as BlockEntry;
  if (prev.result?.locked) return prev.result; // already finished — idempotent

  let score: ScoreResult;
  try {
    score = scoreBlock(block, input.response);
  } catch {
    throw new AppError("That answer couldn't be read. Try again.");
  }
  const n = (prev.attempts ?? 0) + 1;
  const result = toClient(block, score, n);
  const competencyId = "competencyId" in block ? block.competencyId : undefined;
  await db.insert(attempts).values({
    studentId: actor.id,
    courseId: input.courseId,
    lessonId: input.lessonId,
    blockId: block.id,
    competencyId: competencyId ?? null,
    correct: score.correct,
    response: input.response,
    misconceptionId: score.misconceptionId ?? null,
  });
  await mergeBlock(db, actor.id, input.courseId, input.lessonId, block.id, {
    response: input.response,
    correct: score.correct ?? undefined,
    attempts: n,
    done: true, // attempting counts toward lesson completion; correctness feeds proficiency
    result,
  });
  if (competencyId && "check" in block) {
    const comp = getCompetency(competencyId);
    if (comp) {
      await recordCompetencyEvidence(db, {
        studentId: actor.id,
        competencyId,
        level: autoLevel({ correct: score.correct === true, check: block.check, autoAssessable: comp.autoAssessable }),
        reason: `${block.check === "skill" ? "Skill check" : "Practice"} in ${lesson.title}${score.correct ? " (correct)" : ""}`,
        actorId: null,
      });
    }
  }
  return result;
}

/** Autosave for reflections and other free text (spec §57). */
export async function saveDraft(db: DB, actor: Actor, input: { courseId: string; lessonId: string; blockId: string; text: string }) {
  await assertLessonOpen(db, actor, input.courseId, input.lessonId);
  const block = findBlock(lessonFor(input.lessonId), input.blockId);
  if (block.type !== "reflection") throw new AppError("Only reflections autosave.");
  if (input.text.length > 10000) throw new AppError("That reflection is too long (10,000 characters max).");
  await ensureProgressRow(db, actor.id, input.courseId, input.lessonId);
  const row = await readProgress(db, actor.id, input.courseId, input.lessonId);
  const prev = (row?.blockState?.[block.id] ?? {}) as BlockEntry;
  await mergeBlock(db, actor.id, input.courseId, input.lessonId, block.id, { ...prev, response: { draft: input.text } });
  return { savedAt: new Date().toISOString() };
}

export async function submitReflection(db: DB, actor: Actor, input: { courseId: string; lessonId: string; blockId: string; text: string }) {
  await assertLessonOpen(db, actor, input.courseId, input.lessonId);
  const lesson = lessonFor(input.lessonId);
  const block = findBlock(lesson, input.blockId);
  if (block.type !== "reflection") throw new AppError("That isn't a reflection.");
  const text = input.text.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < block.minWords) throw new AppError(`Write at least ${block.minWords} words — you have ${words}.`);
  await ensureProgressRow(db, actor.id, input.courseId, input.lessonId);
  const [ev] = await db
    .insert(evidence)
    .values({
      studentId: actor.id,
      courseId: input.courseId,
      lessonId: input.lessonId,
      blockId: block.id,
      competencyIds: block.competencyIds,
      type: "written",
      response: text,
    })
    .returning();
  await mergeBlock(db, actor.id, input.courseId, input.lessonId, block.id, { response: { text, evidenceId: ev.id }, done: true });
  return ev;
}

export async function completeLesson(db: DB, actor: Actor, input: { courseId: string; lessonId: string }) {
  const { course } = await assertLessonOpen(db, actor, input.courseId, input.lessonId);
  const lesson = lessonFor(input.lessonId);
  const row = await readProgress(db, actor.id, input.courseId, input.lessonId);
  const state = (row?.blockState ?? {}) as Record<string, BlockEntry>;
  const ev = await db
    .select({ blockId: evidence.blockId })
    .from(evidence)
    .where(and(eq(evidence.studentId, actor.id), eq(evidence.courseId, input.courseId), eq(evidence.lessonId, input.lessonId)));
  const evidenceBlocks = new Set(ev.map((e) => e.blockId));
  const missing = allBlocks(lesson)
    .filter(isRequiredBlock)
    .filter((b) => !(state[b.id]?.done || (b.type === "uploadEvidence" && evidenceBlocks.has(b.id))));
  if (missing.length) throw new AppError(`Almost there — ${missing.length} required activit${missing.length === 1 ? "y is" : "ies are"} still open.`);
  if (row?.status !== "completed") {
    await db
      .update(lessonProgress)
      .set({ status: "completed", completedAt: new Date() })
      .where(and(eq(lessonProgress.studentId, actor.id), eq(lessonProgress.courseId, input.courseId), eq(lessonProgress.lessonId, input.lessonId)));
  }
  const { states, curriculum } = await studentLessonStates(db, actor.id, course);
  const next = curriculum.find((c) => states.get(c.lesson.id) === "available" || states.get(c.lesson.id) === "in_progress");
  const unlocked = curriculum.filter((c) => c.lesson.prerequisites.includes(lesson.id) && states.get(c.lesson.id) === "available").map((c) => c.lesson.id);
  return { nextLessonId: next?.lesson.id ?? null, unlocked };
}

/** Approximate time on task: the lesson player pings once a minute while visible. */
export async function heartbeat(db: DB, actor: Actor, input: { courseId: string; lessonId: string }) {
  await assertStudentInCourse(db, actor, input.courseId);
  await db
    .update(lessonProgress)
    .set({ activeMinutes: sql`LEAST(${lessonProgress.activeMinutes} + 1, 100000)`, lastActivityAt: new Date() })
    .where(and(eq(lessonProgress.studentId, actor.id), eq(lessonProgress.courseId, input.courseId), eq(lessonProgress.lessonId, input.lessonId)));
}
