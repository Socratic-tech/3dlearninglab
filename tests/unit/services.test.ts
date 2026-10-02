import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import * as s from "@/server/db/schema";
import { seededDb, otherOrg } from "../helpers/db";
import { canViewStudentWork, isTeacherOfCourse } from "@/server/policy";
import { answerBlock, completeLesson, openLesson } from "@/server/services/progress";
import { getStudentLevels, overrideCompetency } from "@/server/services/mastery";
import { evidenceForStudent, getEvidence, submitEvidence, reviewEvidence } from "@/server/services/evidence";
import { submitPrintJob, transitionPrintJob } from "@/server/services/print-queue";
import { MemoryStorage, setStorageForTests } from "@/server/storage";
import { allBlocks, getLesson } from "@/content";
import type { DB } from "@/server/db/client";

let ctx: Awaited<ReturnType<typeof seededDb>>;
let db: DB;
beforeAll(async () => {
  ctx = await seededDb();
  db = ctx.db;
  setStorageForTests(new MemoryStorage());
});

const asActor = (u: { id: string; role: "student" | "teacher" | "org_admin" | "platform_admin"; organizationId: string }) => ctx.actor(u);

describe("authorization", () => {
  it("a student cannot view another student's private work", async () => {
    const { maya, luis } = ctx.seed.students;
    expect(await canViewStudentWork(db, asActor(maya), luis.id)).toBe(false);
    await expect(evidenceForStudent(db, asActor(maya), luis.id)).rejects.toThrow();
  });

  it("a student cannot open evidence belonging to someone else", async () => {
    const { maya, luis } = ctx.seed.students;
    const [ev] = await db.select().from(s.evidence).where(eq(s.evidence.studentId, luis.id)).limit(1);
    await expect(getEvidence(db, asActor(maya), ev.id)).rejects.toThrow();
  });

  it("a teacher cannot access another organization's class or students", async () => {
    const other = await otherOrg(db);
    const teacher = asActor(ctx.seed.teacher);
    expect(await isTeacherOfCourse(db, teacher, other.course.id)).toBe(false);
    expect(await canViewStudentWork(db, teacher, other.student.id)).toBe(false);
    const otherTeacher = asActor(other.teacher);
    expect(await canViewStudentWork(db, otherTeacher, ctx.seed.students.maya.id)).toBe(false);
  });

  it("an org admin does not see student work unless the organization opts in", async () => {
    const [admin] = await db.select().from(s.users).where(eq(s.users.email, "admin@example.test"));
    expect(await canViewStudentWork(db, asActor(admin), ctx.seed.students.maya.id)).toBe(false);
  });
});

describe("progress vs proficiency", () => {
  it("completing a lesson does not grant proficiency", async () => {
    const jordan = asActor(ctx.seed.students.jordan);
    const courseId = ctx.seed.course.id;
    const lesson = getLesson("align")!;
    // Jordan answers every required block WRONG where possible, then completes the lesson.
    const opened = await openLesson(db, jordan, courseId, "align");
    expect(opened.lesson.id).toBe("align");
    for (const b of allBlocks(lesson)) {
      if (b.type === "multipleChoice") await answerBlock(db, jordan, { courseId, lessonId: "align", blockId: b.id, response: { type: "multipleChoice", optionIds: [b.options.find((o) => !b.correctOptionIds.includes(o.id))!.id] } });
      if (b.type === "prediction") await answerBlock(db, jordan, { courseId, lessonId: "align", blockId: b.id, response: { type: "prediction", optionId: b.options[0].id } });
      if (b.type === "ordering") await answerBlock(db, jordan, { courseId, lessonId: "align", blockId: b.id, response: { type: "ordering", order: [...b.items].reverse().map((i) => i.id) } });
      if (b.type === "matching") await answerBlock(db, jordan, { courseId, lessonId: "align", blockId: b.id, response: { type: "matching", pairs: {} } });
      if (b.type === "measurement") await answerBlock(db, jordan, { courseId, lessonId: "align", blockId: b.id, response: { type: "measurement", value: -999 } });
      if (b.type === "hotspot") await answerBlock(db, jordan, { courseId, lessonId: "align", blockId: b.id, response: { type: "hotspot", point: [9999, 9999, 9999] } });
      if (b.type === "uploadEvidence") await submitEvidence(db, jordan, { courseId, lessonId: "align", blockId: b.id, kind: "design_url", url: "https://www.tinkercad.com/things/x" });
      if (b.type === "reflection") {
        const { submitReflection } = await import("@/server/services/progress");
        await submitReflection(db, jordan, { courseId, lessonId: "align", blockId: b.id, text: "I learned that align uses the shape that does not move as the reference point for everything." });
      }
    }
    await completeLesson(db, jordan, { courseId, lessonId: "align" });
    const [row] = await db.select().from(s.lessonProgress).where(and(eq(s.lessonProgress.studentId, jordan.id), eq(s.lessonProgress.lessonId, "align")));
    expect(row.status).toBe("completed");
    const levels = await getStudentLevels(db, jordan.id);
    expect(["not_attempted", "developing"]).toContain(levels.get("B4")?.level ?? "not_attempted");
  });

  it("refuses to complete a lesson with open required activities", async () => {
    const ava = asActor(ctx.seed.students.ava);
    // Ava has not started "supports" yet but it may be locked; use her current in-progress lesson
    const [inProg] = await db.select().from(s.lessonProgress).where(and(eq(s.lessonProgress.studentId, ava.id), eq(s.lessonProgress.status, "in_progress")));
    await expect(completeLesson(db, ava, { courseId: ctx.seed.course.id, lessonId: inProg.lessonId })).rejects.toThrow(/required/);
  });

  it("locked lessons cannot be opened", async () => {
    const jordan = asActor(ctx.seed.students.jordan);
    await expect(openLesson(db, jordan, ctx.seed.course.id, "final-capstone")).rejects.toThrow(/first/);
  });

  it("a teacher override changes proficiency and is recorded in history", async () => {
    const teacher = asActor(ctx.seed.teacher);
    const jordan = ctx.seed.students.jordan;
    await overrideCompetency(db, { studentId: jordan.id, competencyId: "B4", level: "proficient", comment: "Showed me at the board", actorId: teacher.id, organizationId: teacher.organizationId });
    expect((await getStudentLevels(db, jordan.id)).get("B4")?.level).toBe("proficient");
    const hist = await db.select().from(s.competencyHistory).where(and(eq(s.competencyHistory.studentId, jordan.id), eq(s.competencyHistory.competencyId, "B4")));
    expect(hist.some((h) => h.toLevel === "proficient")).toBe(true);
  });

  it("teacher evidence review raises the level (best wins)", async () => {
    const teacher = asActor(ctx.seed.teacher);
    const [ev] = await db.select().from(s.evidence).where(and(eq(s.evidence.studentId, ctx.seed.students.luis.id), eq(s.evidence.lessonId, "make-it-fit")));
    await reviewEvidence(db, teacher, { evidenceId: ev.id, rating: 3, comment: "Great clearance reasoning" });
    expect((await getStudentLevels(db, ctx.seed.students.luis.id)).get("C7")?.level).toBe("independent");
  });

  it("students cannot review evidence", async () => {
    const [ev] = await db.select().from(s.evidence).limit(1);
    await expect(reviewEvidence(db, asActor(ctx.seed.students.maya), { evidenceId: ev.id, rating: 3 })).rejects.toThrow();
  });
});

describe("print queue", () => {
  it("only appropriate roles can change print status", async () => {
    const maya = asActor(ctx.seed.students.maya);
    const luis = asActor(ctx.seed.students.luis);
    const teacher = asActor(ctx.seed.teacher);
    const stl = Buffer.alloc(84 + 50);
    stl.writeUInt32LE(1, 80);
    const job = await submitPrintJob(db, maya, { courseId: ctx.seed.course.id, title: "Test ring", file: { name: "ring.stl", type: "model/stl", body: stl } });
    expect(job.status).toBe("submitted");
    await expect(transitionPrintJob(db, maya, { jobId: job.id, to: "approved" })).rejects.toThrow();
    await expect(transitionPrintJob(db, luis, { jobId: job.id, to: "draft" })).rejects.toThrow();
    await transitionPrintJob(db, teacher, { jobId: job.id, to: "approved" });
    await transitionPrintJob(db, teacher, { jobId: job.id, to: "queued" });
    await expect(transitionPrintJob(db, teacher, { jobId: job.id, to: "completed" })).rejects.toThrow(); // must print first
    await transitionPrintJob(db, teacher, { jobId: job.id, to: "printing" });
    await expect(transitionPrintJob(db, teacher, { jobId: job.id, to: "failed" })).rejects.toThrow(/reason/);
    const done = await transitionPrintJob(db, teacher, { jobId: job.id, to: "completed" });
    expect(done.status).toBe("completed");
    expect(done.history.length).toBe(5);
  });

  it("rejects files that are not really STL", async () => {
    await expect(
      submitPrintJob(db, asActor(ctx.seed.students.maya), { courseId: ctx.seed.course.id, title: "x", file: { name: "virus.stl", type: "model/stl", body: Buffer.from("MZ not an stl at all") } }),
    ).rejects.toThrow(/damaged/);
  });
});
