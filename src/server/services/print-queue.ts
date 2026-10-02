import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { DB } from "../db/client";
import { courses, evidence, notifications, printJobs, users, type PrintJobEvent } from "../db/schema";
import { assertCanTransitionPrintJob, assertStudentInCourse, taughtCourseIds, type Actor, type PrintStatus } from "../policy";
import { AppError, NotFoundError } from "../errors";
import { storage, validateUpload, safeFileName } from "../storage";
import { getLesson } from "@/content";
import { audit } from "./audit";

export type PrintJob = typeof printJobs.$inferSelect;
export const PRINT_STATUS_LABEL: Record<PrintStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_revision: "Needs revision",
  approved: "Approved",
  queued: "Queued",
  printing: "Printing",
  completed: "Completed",
  failed: "Failed",
};

export async function submitPrintJob(
  db: DB,
  actor: Actor,
  input: { courseId: string; lessonId?: string | null; title: string; notes?: string; estimatedSize?: string; file?: { name: string; type: string; body: Buffer }; evidenceId?: string },
) {
  await assertStudentInCourse(db, actor, input.courseId);
  if (input.lessonId && !getLesson(input.lessonId)) throw new NotFoundError("Lesson");
  let fileKey: string;
  let fileName: string;
  let sizeBytes: number;
  if (input.evidenceId) {
    const [ev] = await db.select().from(evidence).where(eq(evidence.id, input.evidenceId)).limit(1);
    if (!ev || ev.studentId !== actor.id || ev.type !== "stl" || !ev.fileKey) throw new AppError("Choose one of your STL submissions.");
    fileKey = ev.fileKey;
    fileName = ev.fileName ?? "model.stl";
    sizeBytes = ev.sizeBytes ?? 0;
  } else if (input.file) {
    let checked;
    try {
      checked = validateUpload(input.file.name, input.file.type, input.file.body);
    } catch (e) {
      throw new AppError((e as Error).message);
    }
    if (checked.kind !== "stl") throw new AppError("Print requests need an STL file.");
    fileName = safeFileName(input.file.name);
    fileKey = `prints/${actor.organizationId}/${actor.id}/${randomUUID()}-${fileName}`;
    sizeBytes = input.file.body.length;
    await storage().put(fileKey, input.file.body, "model/stl");
  } else throw new AppError("Attach the STL you want printed.");
  const title = input.title.trim() || fileName;
  const history: PrintJobEvent[] = [{ at: new Date().toISOString(), by: actor.id, from: "draft", to: "submitted" }];
  const [job] = await db
    .insert(printJobs)
    .values({
      studentId: actor.id,
      courseId: input.courseId,
      lessonId: input.lessonId ?? null,
      title: title.slice(0, 120),
      fileKey,
      fileName,
      sizeBytes,
      estimatedSize: input.estimatedSize?.slice(0, 60) || null,
      notes: input.notes?.slice(0, 2000) || null,
      status: "submitted",
      history,
    })
    .returning();
  return job;
}

export async function transitionPrintJob(
  db: DB,
  actor: Actor,
  input: { jobId: string; to: PrintStatus; note?: string; printer?: string; filament?: string; estimatedMinutes?: number | null; slicerNotes?: string; failureReason?: string },
) {
  const { job, as } = await assertCanTransitionPrintJob(db, actor, input.jobId, input.to);
  if (input.to === "failed" && !input.failureReason?.trim()) throw new AppError("Add a failure reason so the student can learn from it.");
  if (input.to === "needs_revision" && !input.note?.trim()) throw new AppError("Tell the student what to revise.");
  const event: PrintJobEvent = { at: new Date().toISOString(), by: actor.id, from: job.status, to: input.to, note: input.note?.slice(0, 500) };
  const patch: Partial<PrintJob> = { status: input.to, history: [...job.history, event], updatedAt: new Date() };
  if (as === "teacher") {
    if (input.printer !== undefined) patch.printer = input.printer.slice(0, 80) || null;
    if (input.filament !== undefined) patch.filament = input.filament.slice(0, 80) || null;
    if (input.estimatedMinutes !== undefined) patch.estimatedMinutes = input.estimatedMinutes;
    if (input.slicerNotes !== undefined) patch.slicerNotes = input.slicerNotes.slice(0, 1000) || null;
    if (input.failureReason !== undefined) patch.failureReason = input.failureReason.slice(0, 500) || null;
  }
  // optimistic concurrency: only apply if status hasn't changed since we read it
  const updated = await db
    .update(printJobs)
    .set(patch)
    .where(and(eq(printJobs.id, job.id), eq(printJobs.status, job.status)))
    .returning();
  if (!updated.length) throw new AppError("Someone else just updated this print job. Refresh and try again.", 409);
  if (as === "teacher") {
    await db.insert(notifications).values({
      userId: job.studentId,
      kind: "print",
      body: `Print “${job.title}”: ${PRINT_STATUS_LABEL[input.to]}${input.note ? ` — ${input.note}` : ""}`,
      href: "/student/designs",
    });
    await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "print.transition", targetType: "print_job", targetId: job.id, metadata: { from: job.status, to: input.to } });
  }
  return updated[0];
}

export async function teacherPrintQueue(db: DB, actor: Actor, opts: { courseId?: string; statuses?: PrintStatus[] } = {}) {
  const ids = await taughtCourseIds(db, actor);
  const courseIds = opts.courseId ? ids.filter((i) => i === opts.courseId) : ids;
  if (!courseIds.length) return [];
  const conds = [inArray(printJobs.courseId, courseIds)];
  if (opts.statuses?.length) conds.push(inArray(printJobs.status, opts.statuses));
  return db
    .select({ job: printJobs, student: users.displayName, course: courses.name })
    .from(printJobs)
    .innerJoin(users, eq(users.id, printJobs.studentId))
    .innerJoin(courses, eq(courses.id, printJobs.courseId))
    .where(and(...conds))
    .orderBy(desc(printJobs.updatedAt));
}

export async function studentPrintJobs(db: DB, actor: Actor) {
  return db.select().from(printJobs).where(eq(printJobs.studentId, actor.id)).orderBy(desc(printJobs.updatedAt));
}
