import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { competencyHistory, studentBadges, studentCompetencies, notifications } from "../db/schema";
import { badges, getCompetency, type Proficiency } from "@/content";
import { effectiveLevel, meetsLevel, rank } from "@/lib/mastery";
import { audit } from "./audit";
import { NotFoundError } from "../errors";

export type LevelRow = typeof studentCompetencies.$inferSelect;

export async function getStudentLevels(db: DB, studentId: string): Promise<Map<string, { level: Proficiency; row: LevelRow }>> {
  const rows = await db.select().from(studentCompetencies).where(eq(studentCompetencies.studentId, studentId));
  return new Map(rows.map((r) => [r.competencyId, { level: effectiveLevel(r), row: r }]));
}

export async function getLevelsForStudents(db: DB, studentIds: string[]) {
  if (!studentIds.length) return new Map<string, Map<string, Proficiency>>();
  const rows = await db.select().from(studentCompetencies).where(inArray(studentCompetencies.studentId, studentIds));
  const out = new Map<string, Map<string, Proficiency>>();
  for (const id of studentIds) out.set(id, new Map());
  for (const r of rows) out.get(r.studentId)!.set(r.competencyId, effectiveLevel(r));
  return out;
}

/**
 * Record evidence supporting `level` for a competency. Best level wins (never lowers).
 * Returns the new effective level.
 */
export async function recordCompetencyEvidence(
  db: DB,
  input: { studentId: string; competencyId: string; level: Proficiency; reason: string; actorId?: string | null },
): Promise<Proficiency> {
  if (!getCompetency(input.competencyId)) throw new NotFoundError(`Competency ${input.competencyId}`);
  if (input.level === "not_attempted") return "not_attempted";
  const before = await getOne(db, input.studentId, input.competencyId);
  const now = new Date();
  await db
    .insert(studentCompetencies)
    .values({ studentId: input.studentId, competencyId: input.competencyId, computedLevel: input.level, lastEvidenceAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [studentCompetencies.studentId, studentCompetencies.competencyId],
      set: {
        // Postgres enums are ordered by declaration, so GREATEST implements "best level wins" atomically.
        computedLevel: sql`GREATEST(${studentCompetencies.computedLevel}, excluded.computed_level)`,
        lastEvidenceAt: now,
        updatedAt: now,
      },
    });
  const after = await getOne(db, input.studentId, input.competencyId);
  const from = effectiveLevel(before);
  const to = effectiveLevel(after);
  if (from !== to) {
    await db.insert(competencyHistory).values({ studentId: input.studentId, competencyId: input.competencyId, fromLevel: from, toLevel: to, reason: input.reason, actorId: input.actorId ?? null });
    await recomputeBadges(db, input.studentId);
  }
  return to;
}

/** Teacher override (spec §25). Authorization is checked by the caller (assertCanReviewInCourse). */
export async function overrideCompetency(
  db: DB,
  input: { studentId: string; competencyId: string; level: Proficiency; comment?: string; actorId: string; organizationId: string },
) {
  if (!getCompetency(input.competencyId)) throw new NotFoundError(`Competency ${input.competencyId}`);
  const before = await getOne(db, input.studentId, input.competencyId);
  const now = new Date();
  // Override resets the evidence window: effective = max(override, evidence since override).
  await db
    .insert(studentCompetencies)
    .values({
      studentId: input.studentId,
      competencyId: input.competencyId,
      computedLevel: "not_attempted",
      overrideLevel: input.level,
      overrideAt: now,
      overrideBy: input.actorId,
      overrideComment: input.comment ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [studentCompetencies.studentId, studentCompetencies.competencyId],
      set: { computedLevel: "not_attempted", overrideLevel: input.level, overrideAt: now, overrideBy: input.actorId, overrideComment: input.comment ?? null, updatedAt: now },
    });
  const from = effectiveLevel(before);
  await db.insert(competencyHistory).values({
    studentId: input.studentId,
    competencyId: input.competencyId,
    fromLevel: from,
    toLevel: input.level,
    reason: input.comment ? `Teacher override: ${input.comment}` : "Teacher override",
    actorId: input.actorId,
  });
  await audit(db, {
    actorId: input.actorId,
    organizationId: input.organizationId,
    action: "competency.override",
    targetType: "student",
    targetId: input.studentId,
    metadata: { competencyId: input.competencyId, from, to: input.level },
  });
  await recomputeBadges(db, input.studentId);
}

async function getOne(db: DB, studentId: string, competencyId: string) {
  const [row] = await db
    .select()
    .from(studentCompetencies)
    .where(and(eq(studentCompetencies.studentId, studentId), eq(studentCompetencies.competencyId, competencyId)))
    .limit(1);
  return row;
}

/** Awards (and, after a teacher lowers a level, removes) badges. Returns newly awarded badge ids. */
export async function recomputeBadges(db: DB, studentId: string): Promise<string[]> {
  const levels = await getStudentLevels(db, studentId);
  const owned = new Set((await db.select({ id: studentBadges.badgeId }).from(studentBadges).where(eq(studentBadges.studentId, studentId))).map((r) => r.id));
  const earnedNow: string[] = [];
  for (const b of badges) {
    const earned = b.requires.every((c) => meetsLevel(levels.get(c)?.level ?? "not_attempted", b.minLevel));
    if (earned && !owned.has(b.id)) {
      await db.insert(studentBadges).values({ studentId, badgeId: b.id }).onConflictDoNothing();
      await db.insert(notifications).values({ userId: studentId, kind: "badge", body: `Badge earned: ${b.name}`, href: "/student/skills" });
      earnedNow.push(b.id);
    } else if (!earned && owned.has(b.id)) {
      await db.delete(studentBadges).where(and(eq(studentBadges.studentId, studentId), eq(studentBadges.badgeId, b.id)));
    }
  }
  return earnedNow;
}

export async function competencyHistoryFor(db: DB, studentId: string, competencyId: string) {
  return db
    .select()
    .from(competencyHistory)
    .where(and(eq(competencyHistory.studentId, studentId), eq(competencyHistory.competencyId, competencyId)))
    .orderBy(sql`${competencyHistory.createdAt} desc`);
}

export const isAtLeast = (l: Proficiency, min: Proficiency) => rank(l) >= rank(min);
