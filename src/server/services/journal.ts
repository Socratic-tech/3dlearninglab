import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { designJournals } from "../db/schema";
import { journalPrompts } from "@/content";
import { assertCanViewStudentWork, assertStudentInCourse, type Actor } from "../policy";
import { AppError } from "../errors";

export async function getJournal(db: DB, actor: Actor, input: { studentId: string; courseId: string; projectKey: string }) {
  await assertCanViewStudentWork(db, actor, input.studentId);
  const [row] = await db
    .select()
    .from(designJournals)
    .where(and(eq(designJournals.studentId, input.studentId), eq(designJournals.courseId, input.courseId), eq(designJournals.projectKey, input.projectKey)))
    .limit(1);
  return row ?? null;
}

/**
 * Autosave one journal entry. `revision` provides optimistic concurrency between two open tabs:
 * the merge is per-prompt (jsonb ||), so different prompts never overwrite each other.
 */
export async function saveJournalEntry(db: DB, actor: Actor, input: { courseId: string; projectKey: string; promptId: string; text: string }) {
  await assertStudentInCourse(db, actor, input.courseId);
  if (!journalPrompts.some((p) => p.id === input.promptId)) throw new AppError("Unknown journal prompt.");
  if (!/^[a-z0-9-]{1,40}$/.test(input.projectKey)) throw new AppError("Unknown project.");
  if (input.text.length > 20000) throw new AppError("That entry is too long.");
  const patch = JSON.stringify({ [input.promptId]: input.text });
  const [row] = await db
    .insert(designJournals)
    .values({ studentId: actor.id, courseId: input.courseId, projectKey: input.projectKey, entries: { [input.promptId]: input.text }, revision: 1 })
    .onConflictDoUpdate({
      target: [designJournals.studentId, designJournals.courseId, designJournals.projectKey],
      set: { entries: sql`${designJournals.entries} || ${patch}::jsonb`, revision: sql`${designJournals.revision} + 1`, updatedAt: new Date() },
    })
    .returning();
  return { revision: row.revision, savedAt: row.updatedAt.toISOString() };
}

export async function journalsForStudent(db: DB, actor: Actor, studentId: string) {
  await assertCanViewStudentWork(db, actor, studentId);
  return db.select().from(designJournals).where(eq(designJournals.studentId, studentId));
}
