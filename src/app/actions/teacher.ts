"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { run, str } from "./_run";
import { addStudentManually, createCourse, setEnrollmentStatus, setLessonSetting, updateCourseSettings } from "@/server/services/courses";
import { recordObservation, reviewEvidence } from "@/server/services/evidence";
import { overrideCompetency } from "@/server/services/mastery";
import { saveRubricScore } from "@/server/services/rubrics";
import { transitionPrintJob } from "@/server/services/print-queue";
import { assertCanReviewInCourse } from "@/server/policy";
import { importGoogleCourses, publishAssignment, refreshAssignment, sendGrade, setSyncEnabled, syncRoster } from "@/server/integrations/google/classroom";
import { disconnectGoogle } from "@/server/integrations/google/oauth";
import { getRubric, PROFICIENCY_LEVELS } from "@/content";

const T = ["teacher", "org_admin"] as const;
const path = z.enum(["9-week", "18-week"]);

export async function createCourseAction(_p: unknown, fd: FormData) {
  const r = await run([...T], async ({ db, actor }) =>
    createCourse(db, actor, { name: str(fd, "name", 120), section: str(fd, "section", 60) || null, pathId: path.parse(str(fd, "pathId")) }),
  );
  if (r.ok) redirect(`/teacher/classes/${r.data.id}`);
  return r;
}

export async function updateCourseAction(courseId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    await updateCourseSettings(db, actor, courseId, {
      name: str(fd, "name", 120) || undefined,
      section: str(fd, "section", 60) || null,
      pathId: path.parse(str(fd, "pathId")),
      tinkercadClassUrl: str(fd, "tinkercadClassUrl", 300) || null,
      equipment: {
        printerCount: z.coerce.number().int().min(0).max(200).parse(str(fd, "printerCount") || 0),
        printerModels: str(fd, "printerModels", 200),
        material: str(fd, "material", 40) || "PLA",
        nozzleMm: z.coerce.number().min(0.1).max(2).parse(str(fd, "nozzleMm") || 0.4),
        layerHeightMm: z.coerce.number().min(0.04).max(1).parse(str(fd, "layerHeightMm") || 0.2),
        studentDevices: z.enum(["chromebook", "windows", "mac", "ipad", "mixed"]).parse(str(fd, "studentDevices") || "chromebook"),
        calipersAvailable: fd.get("calipersAvailable") === "on",
      },
    });
    refresh();
    return "Saved";
  });
}

export async function lessonSettingAction(courseId: string, lessonId: string, patch: { enabled?: boolean; dueAt?: string | null; manuallyUnlocked?: boolean; unlockReason?: string | null }) {
  return run([...T], async ({ db, actor }) => {
    await setLessonSetting(db, actor, courseId, lessonId, {
      ...(patch.enabled !== undefined && { enabled: patch.enabled }),
      ...(patch.manuallyUnlocked !== undefined && { manuallyUnlocked: patch.manuallyUnlocked, unlockReason: patch.unlockReason ?? null }),
      ...(patch.dueAt !== undefined && { dueAt: patch.dueAt ? new Date(patch.dueAt) : null }),
    });
    refresh();
    return null;
  });
}

export async function addStudentAction(courseId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const s = await addStudentManually(db, actor, courseId, { displayName: str(fd, "displayName", 120), email: str(fd, "email", 200) });
    refresh();
    return s.displayName;
  });
}

export async function enrollmentAction(courseId: string, studentId: string, status: "active" | "archived") {
  return run([...T], async ({ db, actor }) => {
    await setEnrollmentStatus(db, actor, courseId, studentId, status);
    refresh();
    return null;
  });
}

export async function reviewEvidenceAction(evidenceId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const rating = str(fd, "rating");
    await reviewEvidence(db, actor, {
      evidenceId,
      rating: rating ? (z.coerce.number().int().min(1).max(3).parse(rating) as 1 | 2 | 3) : null,
      comment: str(fd, "comment", 2000),
      needsRevision: fd.get("needsRevision") === "on",
    });
    refresh();
    return "Saved";
  });
}

export async function observationAction(courseId: string, studentId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const [lessonId, blockId, comps] = str(fd, "check").split("|");
    await recordObservation(db, actor, {
      courseId,
      studentId,
      lessonId,
      blockId: blockId || undefined,
      competencyIds: (comps ?? "").split(",").filter(Boolean),
      rating: z.coerce.number().int().min(1).max(3).parse(str(fd, "rating")) as 1 | 2 | 3,
      comment: str(fd, "comment"),
    });
    refresh();
    return "Recorded";
  });
}

export async function overrideAction(courseId: string, studentId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    await assertCanReviewInCourse(db, actor, courseId, studentId);
    await overrideCompetency(db, {
      studentId,
      competencyId: str(fd, "competencyId", 4),
      level: z.enum(PROFICIENCY_LEVELS).parse(str(fd, "level")),
      comment: str(fd, "comment", 500) || undefined,
      actorId: actor.id,
      organizationId: actor.organizationId,
    });
    refresh();
    return "Updated";
  });
}

export async function rubricAction(courseId: string, studentId: string, lessonId: string, rubricId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const rubric = getRubric(rubricId);
    const scores = Object.fromEntries((rubric?.criteria ?? []).map((c) => [c.id, Number(str(fd, `c_${c.id}`))]));
    const r = await saveRubricScore(db, actor, { courseId, studentId, lessonId, rubricId, scores, comment: str(fd, "comment") });
    refresh();
    return `Saved ${r.total}/${r.max}${r.gradeSync === "synced" ? " · sent to Classroom" : r.gradeSync === "failed" ? " · Classroom sync failed (try Send grade)" : ""}`;
  });
}

export async function printTransitionAction(jobId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const mins = str(fd, "estimatedMinutes");
    await transitionPrintJob(db, actor, {
      jobId,
      to: z.enum(["draft", "submitted", "needs_revision", "approved", "queued", "printing", "completed", "failed"]).parse(str(fd, "to")),
      note: str(fd, "note", 500),
      printer: str(fd, "printer", 80),
      filament: str(fd, "filament", 80),
      estimatedMinutes: mins ? Number(mins) : null,
      slicerNotes: str(fd, "slicerNotes", 1000),
      failureReason: str(fd, "failureReason", 500),
    });
    refresh();
    return "Updated";
  });
}

// ───────── Google Classroom ─────────

export async function importClassroomAction(_p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const ids = fd.getAll("googleCourseId").map(String).filter(Boolean);
    if (!ids.length) throw new (await import("@/server/errors")).AppError("Choose at least one class.");
    const r = await importGoogleCourses(db, actor, { googleCourseIds: ids, pathId: path.parse(str(fd, "pathId")) });
    refresh();
    return `${r.filter((x) => x.created).length} class(es) connected.`;
  });
}

export async function syncRosterAction(courseId: string) {
  return run([...T], async ({ db, actor }) => {
    const r = await syncRoster(db, actor, courseId);
    refresh();
    return `Synced: ${r.added} added, ${r.reactivated} returned, ${r.markedNotInRoster} no longer in roster.`;
  });
}

export async function syncEnabledAction(courseId: string, enabled: boolean) {
  return run([...T], async ({ db, actor }) => {
    await setSyncEnabled(db, actor, courseId, enabled);
    refresh();
    return null;
  });
}

export async function publishAction(courseId: string, activityId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    const pts = str(fd, "points");
    const due = str(fd, "dueAt");
    await publishAssignment(db, actor, {
      courseId,
      activityId,
      title: str(fd, "title", 200),
      instructions: str(fd, "instructions", 4000),
      points: pts ? z.coerce.number().min(0).max(1000).parse(pts) : null,
      topic: str(fd, "topic", 100) || null,
      dueAt: due ? new Date(due) : null,
      gradeSyncMode: fd.get("autoSync") === "on" ? "auto" : "manual",
    });
    refresh();
    return "Assigned in Google Classroom";
  });
}

export async function refreshAssignmentAction(assignmentId: string) {
  return run([...T], async ({ db, actor }) => {
    await refreshAssignment(db, actor, assignmentId);
    refresh();
    return null;
  });
}

export async function sendGradeAction(assignmentId: string, studentId: string, _p: unknown, fd: FormData) {
  return run([...T], async ({ db, actor }) => {
    await sendGrade(db, actor, { assignmentId, studentId, score: z.coerce.number().parse(str(fd, "score")), returnToStudent: fd.get("return") === "on" });
    refresh();
    return "Sent";
  });
}

export async function disconnectGoogleAction() {
  return run([...T], async ({ db, actor }) => {
    await disconnectGoogle(db, actor.id);
    refresh();
    return null;
  });
}
