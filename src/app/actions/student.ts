"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { run, str, fileFrom } from "./_run";
import { answerBlock, completeLesson, heartbeat, saveDraft, submitReflection } from "@/server/services/progress";
import { submitEvidence, toggleFeatured } from "@/server/services/evidence";
import { submitPrintJob, transitionPrintJob } from "@/server/services/print-queue";
import { saveJournalEntry } from "@/server/services/journal";
import { joinCourseByCode } from "@/server/services/courses";
import { notifications } from "@/server/db/schema";
import type { BlockResponse } from "@/lib/scoring";

const responseSchema: z.ZodType<BlockResponse> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("prediction"), optionId: z.string().max(40) }),
  z.object({ type: z.literal("multipleChoice"), optionIds: z.array(z.string().max(40)).max(12) }),
  z.object({ type: z.literal("ordering"), order: z.array(z.string().max(40)).max(20) }),
  z.object({ type: z.literal("matching"), pairs: z.record(z.string().max(40), z.string().max(40)) }),
  z.object({ type: z.literal("hotspot"), point: z.tuple([z.number(), z.number(), z.number()]) }),
  z.object({ type: z.literal("measurement"), value: z.number() }),
]);

const ids = z.object({ courseId: z.string().min(1).max(64), lessonId: z.string().regex(/^[a-z0-9-]+$/), blockId: z.string().regex(/^[a-z0-9-]+$/) });

export async function answerBlockAction(input: { courseId: string; lessonId: string; blockId: string; response: BlockResponse }) {
  return run(["student"], async ({ db, actor }) => {
    const parsed = ids.parse(input);
    return answerBlock(db, actor, { ...parsed, response: responseSchema.parse(input.response) });
  });
}

export async function saveDraftAction(input: { courseId: string; lessonId: string; blockId: string; text: string }) {
  return run(["student"], async ({ db, actor }) => saveDraft(db, actor, { ...ids.parse(input), text: String(input.text) }));
}

export async function submitReflectionAction(input: { courseId: string; lessonId: string; blockId: string; text: string }) {
  return run(["student"], async ({ db, actor }) => {
    const ev = await submitReflection(db, actor, { ...ids.parse(input), text: String(input.text) });
    return { evidenceId: ev.id };
  });
}

export async function completeLessonAction(input: { courseId: string; lessonId: string }) {
  return run(["student"], async ({ db, actor }) => {
    const r = await completeLesson(db, actor, ids.omit({ blockId: true }).parse(input));
    refresh();
    return r;
  });
}

export async function heartbeatAction(input: { courseId: string; lessonId: string }) {
  return run(["student"], async ({ db, actor }) => heartbeat(db, actor, ids.omit({ blockId: true }).parse(input)));
}

export async function submitEvidenceAction(formData: FormData) {
  return run(["student"], async ({ db, actor }) => {
    const base = ids.parse({ courseId: str(formData, "courseId"), lessonId: str(formData, "lessonId"), blockId: str(formData, "blockId") });
    const kind = z.enum(["screenshot", "stl", "obj", "design_url", "physical_test"]).parse(str(formData, "kind"));
    const ev = await submitEvidence(db, actor, { ...base, kind, url: str(formData, "url"), note: str(formData, "note", 4000), file: await fileFrom(formData, "file") });
    if (formData.get("requestPrint") === "on" && ev.type === "stl") {
      await submitPrintJob(db, actor, { courseId: base.courseId, lessonId: base.lessonId, title: str(formData, "printTitle") || ev.fileName || "Print request", evidenceId: ev.id, notes: str(formData, "printNotes") });
    }
    refresh();
    return { id: ev.id, type: ev.type, fileName: ev.fileName, url: ev.url, createdAt: ev.createdAt.toISOString() };
  });
}

export async function requestPrintAction(formData: FormData) {
  return run(["student"], async ({ db, actor }) => {
    const job = await submitPrintJob(db, actor, {
      courseId: str(formData, "courseId"),
      lessonId: str(formData, "lessonId") || null,
      title: str(formData, "title", 120),
      notes: str(formData, "notes"),
      estimatedSize: str(formData, "estimatedSize", 60),
      file: await fileFrom(formData, "file"),
      evidenceId: str(formData, "evidenceId") || undefined,
    });
    refresh();
    return { id: job.id };
  });
}

export async function withdrawPrintAction(jobId: string) {
  return run(["student"], async ({ db, actor }) => {
    await transitionPrintJob(db, actor, { jobId, to: "draft" });
    refresh();
    return null;
  });
}

export async function resubmitPrintAction(jobId: string) {
  return run(["student"], async ({ db, actor }) => {
    await transitionPrintJob(db, actor, { jobId, to: "submitted" });
    refresh();
    return null;
  });
}

export async function saveJournalAction(input: { courseId: string; projectKey: string; promptId: string; text: string }) {
  return run(["student"], async ({ db, actor }) => saveJournalEntry(db, actor, input));
}

export async function joinCourseAction(_prev: unknown, formData: FormData) {
  return run(["student"], async ({ db, actor }) => {
    const c = await joinCourseByCode(db, actor, str(formData, "code", 12));
    (await cookies()).set("current_course", c.id, { path: "/", sameSite: "lax", httpOnly: true });
    refresh();
    return { name: c.name };
  });
}

export async function selectCourseAction(courseId: string) {
  (await cookies()).set("current_course", courseId, { path: "/", sameSite: "lax", httpOnly: true });
  refresh();
}

export async function toggleFeaturedAction(evidenceId: string, featured: boolean) {
  return run(["student"], async ({ db, actor }) => {
    await toggleFeatured(db, actor, evidenceId, featured);
    refresh();
    return null;
  });
}

export async function markNotificationsReadAction() {
  return run(["student", "teacher", "org_admin", "platform_admin"], async ({ db, actor }) => {
    await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
    refresh();
    return null;
  });
}
