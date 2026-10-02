import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import * as s from "@/server/db/schema";
import { seededDb } from "../helpers/db";
import { FakeClassroomClient, defaultFakeState } from "@/server/integrations/google/fake-client";
import { importGoogleCourses, listGoogleCourses, publishAssignment, sendGrade, setClassroomFactoryForTests, syncRoster } from "@/server/integrations/google/classroom";
import type { DB } from "@/server/db/client";

let ctx: Awaited<ReturnType<typeof seededDb>>;
let db: DB;
let fake: FakeClassroomClient;
let key = 0;

beforeEach(async () => {
  ctx = await seededDb();
  db = ctx.db;
  const k = `test-${key++}`;
  fake = new FakeClassroomClient(k, () => defaultFakeState("demo-teacher"));
  setClassroomFactoryForTests(() => fake);
});

const teacher = () => ctx.actor(ctx.seed.teacher);

describe("Google Classroom roster sync", () => {
  it("is idempotent", async () => {
    const first = await syncRoster(db, teacher(), ctx.seed.course.id);
    const before = await db.select().from(s.enrollments).where(eq(s.enrollments.courseId, ctx.seed.course.id));
    const second = await syncRoster(db, teacher(), ctx.seed.course.id);
    const after = await db.select().from(s.enrollments).where(eq(s.enrollments.courseId, ctx.seed.course.id));
    expect(first.added).toBe(1); // Sam is in Classroom but not yet local
    expect(second).toEqual({ added: 0, updated: 0, reactivated: 0, markedNotInRoster: 0, teachersAdded: 0 });
    expect(after.length).toBe(before.length);
  });

  it("marks students missing from Classroom instead of deleting their progress", async () => {
    fake.state.students.set("gc-period-2", fake.state.students.get("gc-period-2")!.filter((x) => x.userId !== "demo-sub-mia"));
    const r = await syncRoster(db, teacher(), ctx.seed.course.id);
    expect(r.markedNotInRoster).toBe(1);
    const mia = ctx.seed.students.mia;
    const [enr] = await db.select().from(s.enrollments).where(and(eq(s.enrollments.courseId, ctx.seed.course.id), eq(s.enrollments.userId, mia.id)));
    expect(enr.status).toBe("not_in_roster");
    const progress = await db.select().from(s.lessonProgress).where(eq(s.lessonProgress.studentId, mia.id));
    expect(progress.length).toBeGreaterThan(0);
  });

  it("a failed API call does not corrupt local data", async () => {
    const before = await db.select().from(s.enrollments).where(eq(s.enrollments.courseId, ctx.seed.course.id));
    fake.failNext(500, 5);
    await expect(syncRoster(db, teacher(), ctx.seed.course.id)).rejects.toThrow(/Classroom/);
    const after = await db.select().from(s.enrollments).where(eq(s.enrollments.courseId, ctx.seed.course.id));
    expect(after).toEqual(before);
    const [m] = await db.select().from(s.googleCourseMappings).where(eq(s.googleCourseMappings.localCourseId, ctx.seed.course.id));
    expect(m.lastSyncStatus).toBe("error");
  });

  it("imports a Classroom course with its roster, and re-import does not duplicate", async () => {
    const list = await listGoogleCourses(db, teacher());
    expect(list.find((c) => c.id === "gc-period-2")?.linkedLocalCourseId).toBe(ctx.seed.course.id);
    const r1 = await importGoogleCourses(db, teacher(), { googleCourseIds: ["gc-period-5"], pathId: "9-week" });
    const r2 = await importGoogleCourses(db, teacher(), { googleCourseIds: ["gc-period-5"], pathId: "9-week" });
    expect(r1[0].created).toBe(true);
    expect(r2[0].created).toBe(false);
    expect(r2[0].localCourseId).toBe(r1[0].localCourseId);
    const enr = await db.select().from(s.enrollments).where(eq(s.enrollments.courseId, r1[0].localCourseId));
    expect(enr).toHaveLength(4);
  });
});

describe("Google Classroom coursework", () => {
  const input = () => ({ courseId: ctx.seed.course.id, activityId: "cad-er", title: "CAD ER", instructions: "Diagnose the phone stand.", points: 16, topic: "Challenges", dueAt: new Date("2026-11-01T15:00:00Z") });

  it("publishes once and prevents duplicates", async () => {
    const a = await publishAssignment(db, teacher(), input());
    expect(a!.status).toBe("published");
    expect(a!.googleCourseWorkId).toBeTruthy();
    await expect(publishAssignment(db, teacher(), input())).rejects.toThrow(/already/);
    expect(fake.state.courseWork.get("gc-period-2")).toHaveLength(1);
  });

  it("a failed publish is recorded and can be retried", async () => {
    fake.failNext(403, 1);
    await expect(publishAssignment(db, teacher(), input())).rejects.toThrow(/Google Classroom/);
    const [row] = await db.select().from(s.assignments).where(eq(s.assignments.activityId, "cad-er"));
    expect(row.status).toBe("failed");
    const retry = await publishAssignment(db, teacher(), input());
    expect(retry!.status).toBe("published");
  });

  it("sends a grade to the student's submission", async () => {
    const a = await publishAssignment(db, teacher(), input());
    await sendGrade(db, teacher(), { assignmentId: a!.id, studentId: ctx.seed.students.ava.id, score: 14, returnToStudent: true });
    const sub = fake.state.submissions.get(a!.googleCourseWorkId!)!.find((x) => x.userId === "demo-sub-ava")!;
    expect(sub.assignedGrade).toBe(14);
    expect(sub.state).toBe("RETURNED");
    await expect(sendGrade(db, teacher(), { assignmentId: a!.id, studentId: ctx.seed.students.ava.id, score: 99 })).rejects.toThrow(/between/);
  });

  it("students cannot publish", async () => {
    await expect(publishAssignment(db, ctx.actor(ctx.seed.students.maya), input())).rejects.toThrow();
  });
});
