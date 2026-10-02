import "server-only";
import { and, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { assignments, rubricScores } from "../db/schema";
import { getRubric, type Proficiency } from "@/content";
import { assertCanReviewInCourse, type Actor } from "../policy";
import { AppError, NotFoundError } from "../errors";
import { recordCompetencyEvidence } from "./mastery";
import { audit } from "./audit";

export function levelFromCriterion(score: number, max: number): Proficiency {
  if (score <= 0) return "not_attempted";
  const r = score / max;
  if (r >= 1) return "independent";
  if (r >= 0.75) return "proficient";
  return "developing";
}

export async function saveRubricScore(
  db: DB,
  actor: Actor,
  input: { courseId: string; studentId: string; lessonId: string; rubricId: string; scores: Record<string, number>; comment?: string },
) {
  await assertCanReviewInCourse(db, actor, input.courseId, input.studentId);
  const rubric = getRubric(input.rubricId);
  if (!rubric) throw new NotFoundError("Rubric");
  let total = 0;
  let max = 0;
  for (const c of rubric.criteria) {
    const v = input.scores[c.id];
    if (v === undefined || !Number.isInteger(v) || v < 0 || v > c.max) throw new AppError(`Score each criterion from 0 to ${c.max} (${c.label}).`);
    total += v;
    max += c.max;
  }
  await db
    .insert(rubricScores)
    .values({ ...input, total, max, comment: input.comment ?? null, scoredBy: actor.id })
    .onConflictDoUpdate({
      target: [rubricScores.studentId, rubricScores.courseId, rubricScores.lessonId],
      set: { rubricId: input.rubricId, scores: input.scores, total, max, comment: input.comment ?? null, scoredBy: actor.id, updatedAt: new Date() },
    });
  for (const c of rubric.criteria) {
    const lvl = levelFromCriterion(input.scores[c.id], c.max);
    for (const comp of c.competencyIds) {
      await recordCompetencyEvidence(db, { studentId: input.studentId, competencyId: comp, level: lvl, reason: `${rubric.title}: ${c.label} ${input.scores[c.id]}/${c.max}`, actorId: actor.id });
    }
  }
  await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "rubric.score", targetType: "student", targetId: input.studentId, metadata: { lessonId: input.lessonId, total, max } });

  // Optional automatic grade sync for assignments configured that way (teacher remains in control).
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.courseId, input.courseId), eq(assignments.activityId, input.lessonId)))
    .limit(1);
  let gradeSync: "skipped" | "synced" | "failed" = "skipped";
  if (assignment?.status === "published" && assignment.gradeSyncMode === "auto" && assignment.points) {
    const { sendGrade } = await import("../integrations/google/classroom");
    try {
      await sendGrade(db, actor, { assignmentId: assignment.id, studentId: input.studentId, score: Math.round((total / max) * assignment.points * 10) / 10 });
      gradeSync = "synced";
    } catch {
      gradeSync = "failed";
    }
  }
  return { total, max, gradeSync };
}

export async function getRubricScore(db: DB, courseId: string, studentId: string, lessonId: string) {
  const [row] = await db
    .select()
    .from(rubricScores)
    .where(and(eq(rubricScores.courseId, courseId), eq(rubricScores.studentId, studentId), eq(rubricScores.lessonId, lessonId)))
    .limit(1);
  return row ?? null;
}

/** Suggested Classroom score: rubric total scaled to the assignment's points. */
export function scaledScore(total: number, max: number, points: number) {
  return Math.round((total / max) * points * 10) / 10;
}
