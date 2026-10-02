import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { evidence, lessonProgress, notifications, organizations, teacherFeedback, users, portfolioItems } from "../db/schema";
import { allBlocks, getLesson } from "@/content";
import { levelFromRating } from "@/lib/mastery";
import { assertCanReviewInCourse, assertCanViewStudentWork, assertStudentInCourse, type Actor } from "../policy";
import { AppError, ForbiddenError, NotFoundError } from "../errors";
import { storage, validateUpload, safeFileName } from "../storage";
import { recordCompetencyEvidence } from "./mastery";
import { audit } from "./audit";

export type Evidence = typeof evidence.$inferSelect;

function uploadBlock(lessonId: string, blockId: string) {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new NotFoundError("Lesson");
  const block = allBlocks(lesson).find((b) => b.id === blockId);
  if (!block || block.type !== "uploadEvidence") throw new NotFoundError("Submission activity");
  return { lesson, block };
}

export function normalizeDesignUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new AppError("Paste the whole link, starting with https://");
  }
  if (u.protocol !== "https:") throw new AppError("Links must start with https://");
  return u.toString();
}

export async function submitEvidence(
  db: DB,
  actor: Actor,
  input: {
    courseId: string;
    lessonId: string;
    blockId: string;
    kind: "screenshot" | "stl" | "obj" | "design_url" | "physical_test";
    url?: string;
    note?: string;
    file?: { name: string; type: string; body: Buffer };
  },
): Promise<Evidence> {
  await assertStudentInCourse(db, actor, input.courseId);
  const { block } = uploadBlock(input.lessonId, input.blockId);
  if (!block.accepts.includes(input.kind)) throw new AppError("This activity doesn't accept that kind of submission.");
  const [org] = await db.select().from(organizations).where(eq(organizations.id, actor.organizationId)).limit(1);
  const values: typeof evidence.$inferInsert = {
    studentId: actor.id,
    courseId: input.courseId,
    lessonId: input.lessonId,
    blockId: input.blockId,
    competencyIds: block.competencyIds,
    type: input.kind,
    response: input.note?.slice(0, 4000) || null,
  };
  if (input.kind === "design_url") {
    if (!input.url) throw new AppError("Paste your design link.");
    values.url = normalizeDesignUrl(input.url);
  } else if (input.kind === "physical_test") {
    if (!input.note?.trim() && !input.file) throw new AppError("Describe your test result or add a photo.");
  }
  if (input.file) {
    if (org?.settings.studentUploadsEnabled === false) throw new AppError("File uploads are turned off for your school. Share a design link instead.");
    let checked;
    try {
      checked = validateUpload(input.file.name, input.file.type, input.file.body, org?.settings.maxUploadMb);
    } catch (e) {
      throw new AppError((e as Error).message);
    }
    const wantKind = input.kind === "physical_test" ? "screenshot" : input.kind;
    if (checked.kind !== wantKind) throw new AppError(`Choose a ${wantKind === "screenshot" ? "PNG or JPG image" : wantKind.toUpperCase() + " file"}.`);
    const key = `evidence/${actor.organizationId}/${actor.id}/${randomUUID()}-${safeFileName(input.file.name)}`;
    await storage().put(key, input.file.body, checked.contentType);
    values.fileKey = key;
    values.fileName = safeFileName(input.file.name);
    values.mimeType = checked.contentType;
    values.sizeBytes = input.file.body.length;
  } else if (input.kind === "screenshot" || input.kind === "stl" || input.kind === "obj") {
    throw new AppError("Choose a file to upload.");
  }
  const [row] = await db.insert(evidence).values(values).returning();
  // mark the block done so the lesson can be completed
  await db
    .insert(lessonProgress)
    .values({ studentId: actor.id, courseId: input.courseId, lessonId: input.lessonId, status: "in_progress", startedAt: new Date(), lastActivityAt: new Date() })
    .onConflictDoNothing();
  await db
    .update(lessonProgress)
    .set({ blockState: sql`${lessonProgress.blockState} || ${JSON.stringify({ [input.blockId]: { done: true, updatedAt: new Date().toISOString() } })}::jsonb`, lastActivityAt: new Date() })
    .where(and(eq(lessonProgress.studentId, actor.id), eq(lessonProgress.courseId, input.courseId), eq(lessonProgress.lessonId, input.lessonId)));
  return row;
}

export async function getEvidence(db: DB, actor: Actor, evidenceId: string): Promise<Evidence> {
  const [row] = await db.select().from(evidence).where(eq(evidence.id, evidenceId)).limit(1);
  if (!row) throw new NotFoundError("Evidence");
  if (row.studentId !== actor.id) await assertCanReviewInCourse(db, actor, row.courseId, row.studentId);
  return row;
}

/** Authorize a private file download by storage key. */
export async function authorizeFileKey(db: DB, actor: Actor, key: string): Promise<{ fileName: string; contentType?: string }> {
  const [row] = await db.select().from(evidence).where(eq(evidence.fileKey, key)).limit(1);
  if (row) {
    if (row.studentId !== actor.id) await assertCanReviewInCourse(db, actor, row.courseId, row.studentId);
    return { fileName: row.fileName ?? "file", contentType: row.mimeType ?? undefined };
  }
  const { printJobs, customAssets } = await import("../db/schema");
  const [job] = await db.select().from(printJobs).where(eq(printJobs.fileKey, key)).limit(1);
  if (job) {
    if (job.studentId !== actor.id) await assertCanReviewInCourse(db, actor, job.courseId, job.studentId);
    return { fileName: job.fileName, contentType: "model/stl" };
  }
  const [asset] = await db.select().from(customAssets).where(eq(customAssets.fileKey, key)).limit(1);
  if (asset) {
    if (asset.organizationId !== actor.organizationId) throw new ForbiddenError();
    return { fileName: asset.fileName };
  }
  throw new NotFoundError("File");
}

export async function reviewEvidence(
  db: DB,
  actor: Actor,
  input: { evidenceId: string; rating: 1 | 2 | 3 | null; comment?: string; needsRevision?: boolean },
) {
  const [row] = await db.select().from(evidence).where(eq(evidence.id, input.evidenceId)).limit(1);
  if (!row) throw new NotFoundError("Evidence");
  await assertCanReviewInCourse(db, actor, row.courseId, row.studentId);
  const comment = input.comment?.trim() || null;
  await db
    .update(evidence)
    .set({
      teacherRating: input.rating,
      teacherComment: comment,
      status: input.needsRevision ? "needs_revision" : "reviewed",
      reviewedBy: actor.id,
      reviewedAt: new Date(),
    })
    .where(eq(evidence.id, row.id));
  if (input.rating) {
    for (const c of row.competencyIds) {
      await recordCompetencyEvidence(db, {
        studentId: row.studentId,
        competencyId: c,
        level: levelFromRating(input.rating),
        reason: `Teacher reviewed ${row.type.replace("_", " ")} in ${getLesson(row.lessonId)?.title ?? row.lessonId}`,
        actorId: actor.id,
      });
    }
  }
  if (comment) {
    await db.insert(teacherFeedback).values({ studentId: row.studentId, courseId: row.courseId, lessonId: row.lessonId, evidenceId: row.id, authorId: actor.id, body: comment });
  }
  await db.insert(notifications).values({
    userId: row.studentId,
    kind: "feedback",
    body: input.needsRevision ? `Your teacher asked for a revision in ${getLesson(row.lessonId)?.title}.` : `Your teacher reviewed your work in ${getLesson(row.lessonId)?.title}.`,
    href: `/student/lessons/${row.lessonId}`,
  });
  await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "evidence.review", targetType: "evidence", targetId: row.id, metadata: { rating: input.rating, needsRevision: !!input.needsRevision } });
}

/** Teacher-observed evidence (teacherCheck blocks, physical tests, project rubric). */
export async function recordObservation(
  db: DB,
  actor: Actor,
  input: { courseId: string; studentId: string; lessonId: string; blockId?: string; competencyIds: string[]; rating: 1 | 2 | 3; comment?: string },
) {
  await assertCanReviewInCourse(db, actor, input.courseId, input.studentId);
  if (!getLesson(input.lessonId)) throw new NotFoundError("Lesson");
  const [row] = await db
    .insert(evidence)
    .values({
      studentId: input.studentId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      blockId: input.blockId ?? null,
      competencyIds: input.competencyIds,
      type: "teacher_observation",
      response: input.comment ?? null,
      status: "reviewed",
      teacherRating: input.rating,
      teacherComment: input.comment ?? null,
      reviewedBy: actor.id,
      reviewedAt: new Date(),
    })
    .returning();
  for (const c of input.competencyIds) {
    await recordCompetencyEvidence(db, { studentId: input.studentId, competencyId: c, level: levelFromRating(input.rating), reason: "Teacher observation", actorId: actor.id });
  }
  if (input.blockId) {
    await db
      .insert(lessonProgress)
      .values({ studentId: input.studentId, courseId: input.courseId, lessonId: input.lessonId, status: "in_progress", startedAt: new Date() })
      .onConflictDoNothing();
    await db
      .update(lessonProgress)
      .set({ blockState: sql`${lessonProgress.blockState} || ${JSON.stringify({ [input.blockId]: { done: true, updatedAt: new Date().toISOString() } })}::jsonb` })
      .where(and(eq(lessonProgress.studentId, input.studentId), eq(lessonProgress.courseId, input.courseId), eq(lessonProgress.lessonId, input.lessonId)));
  }
  return row;
}

export async function reviewQueue(db: DB, courseId: string, opts: { status?: Evidence["status"][] } = {}) {
  const statuses = opts.status ?? ["submitted"];
  return db
    .select({ evidence, student: { id: users.id, displayName: users.displayName } })
    .from(evidence)
    .innerJoin(users, eq(users.id, evidence.studentId))
    .where(and(eq(evidence.courseId, courseId), inArray(evidence.status, statuses)))
    .orderBy(desc(evidence.createdAt));
}

export async function evidenceForStudent(db: DB, actor: Actor, studentId: string, opts: { courseId?: string; competencyId?: string } = {}) {
  await assertCanViewStudentWork(db, actor, studentId);
  const conds = [eq(evidence.studentId, studentId)];
  if (opts.courseId) conds.push(eq(evidence.courseId, opts.courseId));
  if (opts.competencyId) conds.push(sql`${evidence.competencyIds} @> ${JSON.stringify([opts.competencyId])}::jsonb`);
  return db.select().from(evidence).where(and(...conds)).orderBy(desc(evidence.createdAt));
}

export async function feedbackForStudent(db: DB, actor: Actor, studentId: string) {
  await assertCanViewStudentWork(db, actor, studentId);
  return db
    .select({ feedback: teacherFeedback, author: users.displayName })
    .from(teacherFeedback)
    .innerJoin(users, eq(users.id, teacherFeedback.authorId))
    .where(eq(teacherFeedback.studentId, studentId))
    .orderBy(desc(teacherFeedback.createdAt));
}

export async function toggleFeatured(db: DB, actor: Actor, evidenceId: string, featured: boolean, caption?: string) {
  const [row] = await db.select().from(evidence).where(eq(evidence.id, evidenceId)).limit(1);
  if (!row || row.studentId !== actor.id) throw new ForbiddenError();
  if (featured) {
    await db
      .insert(portfolioItems)
      .values({ studentId: actor.id, evidenceId, caption: caption ?? null })
      .onConflictDoUpdate({ target: [portfolioItems.studentId, portfolioItems.evidenceId], set: { caption: caption ?? null } });
  } else {
    await db.delete(portfolioItems).where(and(eq(portfolioItems.studentId, actor.id), eq(portfolioItems.evidenceId, evidenceId)));
  }
}
