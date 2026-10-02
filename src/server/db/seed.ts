import { and, eq, sql } from "drizzle-orm";
import type { DB } from "./client";
import * as s from "./schema";
import { badges, heatmapGroups, lessonsInPath, type Proficiency } from "@/content";
import { meetsLevel } from "@/lib/mastery";

/**
 * Demo / development seed (spec §49–50). Everything lives in one organization flagged isDemo so it can be
 * reset without touching real data.
 */
export const DEMO = {
  orgName: "Demo Middle School",
  domain: "example.test",
  teacher: { email: "teacher@example.test", name: "Ms. Rivera", sub: "demo-teacher" },
  orgAdmin: { email: "admin@example.test", name: "Dr. Okoye (Admin)" },
  platformAdmin: { email: "platform@example.test", name: "Platform Admin" },
  course: { name: "3D Design", section: "Period 2", googleCourseId: "gc-period-2" },
  students: [
    { key: "maya", name: "Maya Okafor", email: "maya@example.test", sub: "demo-sub-maya" },
    { key: "luis", name: "Luis Hernández", email: "luis@example.test", sub: "demo-sub-luis" },
    { key: "ava", name: "Ava Chen", email: "ava@example.test", sub: "demo-sub-ava" },
    { key: "jordan", name: "Jordan Price", email: "jordan@example.test", sub: "demo-sub-jordan" },
    { key: "mia", name: "Mia Rossi", email: "mia@example.test", sub: "demo-sub-mia" },
  ],
} as const;

type Key = (typeof DEMO.students)[number]["key"];
const L: Record<number, Proficiency> = { 0: "not_attempted", 1: "developing", 2: "proficient", 3: "independent" };

/** Heatmap profile from the spec (§25) extended across groups. 0 = not attempted. */
const PROFILE: Record<Key, Partial<Record<string, number>>> = {
  maya: { navigate: 3, move: 3, scale: 3, rotate: 3, group: 3, holes: 2, align: 3, pattern: 3, detail: 2, measure: 2, tolerance: 1, walls: 1, printability: 2, strength: 1, iterate: 2 },
  luis: { navigate: 3, move: 3, scale: 3, rotate: 2, group: 2, holes: 2, align: 2, pattern: 2, detail: 2, measure: 3, tolerance: 2, walls: 2, printability: 2, strength: 2, iterate: 1 },
  ava: { navigate: 3, move: 3, scale: 2, rotate: 3, group: 3, holes: 3, align: 3, pattern: 3, detail: 3, measure: 3, tolerance: 3, walls: 2, printability: 2, strength: 2, troubleshoot: 1, iterate: 3 },
  jordan: { navigate: 2, move: 2, scale: 2, rotate: 1, group: 2, holes: 1, align: 1, pattern: 1, detail: 1, measure: 1 },
  mia: { navigate: 3, move: 2, scale: 2, rotate: 2, group: 2, holes: 2, align: 2, pattern: 2, detail: 2, measure: 2, tolerance: 1, walls: 1 },
};
/** How many lessons of the 18-week path each student has completed. */
const COMPLETED: Record<Key, number> = { maya: 24, luis: 23, ava: 27, jordan: 14, mia: 21 };

export async function ensureSeeded(db: DB) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.organizations);
  if (n === 0) await seedDemo(db);
}

export async function resetDemo(db: DB) {
  await db.delete(s.organizations).where(eq(s.organizations.isDemo, true));
  const { FakeClassroomClient } = await import("../integrations/google/fake-client");
  FakeClassroomClient.reset(DEMO.teacher.sub);
  await seedDemo(db);
}

export async function seedDemo(db: DB) {
  const now = Date.now();
  const days = (d: number) => new Date(now - d * 864e5);

  const [org] = await db
    .insert(s.organizations)
    .values({ name: DEMO.orgName, googleDomain: DEMO.domain, isDemo: true, settings: { studentUploadsEnabled: true, maxUploadMb: 25, adminCanViewStudentWork: false } })
    .returning();
  const mk = (v: Omit<typeof s.users.$inferInsert, "organizationId" | "isDemo">) => ({ ...v, organizationId: org.id, isDemo: true });
  const [teacher] = await db.insert(s.users).values(mk({ email: DEMO.teacher.email, displayName: DEMO.teacher.name, role: "teacher", googleSub: DEMO.teacher.sub })).returning();
  await db.insert(s.users).values([
    mk({ email: DEMO.orgAdmin.email, displayName: DEMO.orgAdmin.name, role: "org_admin" }),
    mk({ email: DEMO.platformAdmin.email, displayName: DEMO.platformAdmin.name, role: "platform_admin" }),
  ]);
  const students = await db
    .insert(s.users)
    .values(DEMO.students.map((st) => mk({ email: st.email, displayName: st.name, role: "student", googleSub: st.sub })))
    .returning();
  const byKey = Object.fromEntries(DEMO.students.map((st, i) => [st.key, students[i]])) as Record<Key, (typeof students)[number]>;

  const [course] = await db
    .insert(s.courses)
    .values({
      organizationId: org.id,
      name: DEMO.course.name,
      section: DEMO.course.section,
      pathId: "18-week",
      startDate: days(7 * 11),
      tinkercadClassUrl: "https://www.tinkercad.com/joinclass/",
      equipment: { printerCount: 4, printerModels: "Prusa MK4 ×2, Bambu A1 mini ×2", material: "PLA", nozzleMm: 0.4, layerHeightMm: 0.2, studentDevices: "chromebook", calipersAvailable: true },
      joinCode: "DEMO42",
    })
    .returning();
  await db.insert(s.courseTeachers).values({ courseId: course.id, userId: teacher.id, source: "google" });
  await db.insert(s.enrollments).values(students.map((st) => ({ courseId: course.id, userId: st.id, status: "active" as const, source: "google" })));
  await db.insert(s.googleCourseMappings).values({
    localCourseId: course.id,
    googleCourseId: DEMO.course.googleCourseId,
    googleTeacherId: DEMO.teacher.sub,
    connectedByUserId: teacher.id,
    lastSyncedAt: days(0.2),
    lastSyncStatus: "ok",
  });

  // Lesson progress
  const path = lessonsInPath("18-week").map((x) => x.lesson);
  for (const key of Object.keys(COMPLETED) as Key[]) {
    const st = byKey[key];
    const done = COMPLETED[key];
    const rows = path.slice(0, done + 1).map((lesson, i) => {
      const completed = i < done;
      const at = days(Math.max(0.1, (done - i) * 2.2));
      return {
        studentId: st.id,
        courseId: course.id,
        lessonId: lesson.id,
        status: completed ? ("completed" as const) : ("in_progress" as const),
        startedAt: at,
        completedAt: completed ? at : null,
        lastActivityAt: key === "jordan" && !completed ? days(1) : completed ? at : days(0.05),
        activeMinutes: 35 + ((i * 7) % 20),
      };
    });
    await db.insert(s.lessonProgress).values(rows);
  }

  // Competency levels from the profile
  for (const key of Object.keys(PROFILE) as Key[]) {
    const prof = PROFILE[key];
    const values: (typeof s.studentCompetencies.$inferInsert)[] = [];
    for (const g of heatmapGroups) {
      const lvl = prof[g.id] ?? 0;
      if (!lvl) continue;
      g.competencyIds.forEach((c, i) => {
        // small variation inside a group keeps the detail view realistic
        const v = Math.max(1, lvl - (i % 3 === 2 ? 1 : 0));
        if (!values.some((x) => x.competencyId === c)) values.push({ studentId: byKey[key].id, competencyId: c, computedLevel: L[v], lastEvidenceAt: days(3) });
      });
    }
    if (values.length) await db.insert(s.studentCompetencies).values(values);
  }
  // Badges follow from the levels (same rule as services/mastery.recomputeBadges)
  for (const key of Object.keys(PROFILE) as Key[]) {
    const rows = await db.select().from(s.studentCompetencies).where(eq(s.studentCompetencies.studentId, byKey[key].id));
    const lv = new Map(rows.map((r) => [r.competencyId, r.computedLevel]));
    const earned = badges.filter((b) => b.requires.every((c) => meetsLevel(lv.get(c) ?? "not_attempted", b.minLevel)));
    if (earned.length) await db.insert(s.studentBadges).values(earned.map((b) => ({ studentId: byKey[key].id, badgeId: b.id, awardedAt: days(4) })));
  }

  // Jordan: three attempts on the Align skill check without success → "may need help"
  await db.insert(s.attempts).values(
    [1, 2, 3].map((i) => ({
      studentId: byKey.jordan.id,
      courseId: course.id,
      lessonId: "align",
      blockId: alignSkillBlock(),
      competencyId: "B4",
      correct: false,
      response: { type: "multipleChoice", optionIds: ["x"] },
      createdAt: days(1 + i * 0.01),
    })),
  );

  // Evidence: some awaiting review, some reviewed, Mia's tolerance needs revision
  await db.insert(s.evidence).values([
    { studentId: byKey.maya.id, courseId: course.id, lessonId: "boss-die", blockId: "submit", competencyIds: ["A9", "B2", "B3"], type: "design_url", url: "https://www.tinkercad.com/things/demo-maya-die", response: "Checked 20.00 × 20.00 × 20.00 in the shape panel.", status: "reviewed", teacherRating: 3, teacherComment: "Clean grouping and every recess is 1.5 mm deep. Independent.", reviewedBy: teacher.id, reviewedAt: days(9), createdAt: days(10) },
    { studentId: byKey.luis.id, courseId: course.id, lessonId: "make-it-fit", blockId: "submit", competencyIds: ["C7", "C8"], type: "design_url", url: "https://www.tinkercad.com/things/demo-luis-clip", response: "Marker cap clip. Measured 14.2 mm, used 14.6 mm hole.", status: "submitted", createdAt: days(1) },
    { studentId: byKey.ava.id, courseId: course.id, lessonId: "orientation", blockId: "submit", competencyIds: ["D6", "D7"], type: "written", response: "I would print the hook lying flat because the layers would then run along the curve, so the load pulls along the layers instead of peeling them apart.", status: "submitted", createdAt: days(0.5) },
    { studentId: byKey.mia.id, courseId: course.id, lessonId: "tolerances", blockId: "class-results", competencyIds: ["C5", "C6"], type: "physical_test", response: "The 10.2 one fit.", status: "needs_revision", teacherComment: "Which holes did you test, and how did each one feel? Add all three results.", reviewedBy: teacher.id, reviewedAt: days(2), createdAt: days(3) },
    { studentId: byKey.jordan.id, courseId: course.id, lessonId: "holes", blockId: "reflect", competencyIds: ["B3"], type: "written", response: "Subtracting is easier when you want a cup because you just put a hole box in a solid box.", status: "submitted", createdAt: days(2) },
  ]);
  await db.insert(s.teacherFeedback).values({
    studentId: byKey.mia.id,
    courseId: course.id,
    lessonId: "tolerances",
    authorId: teacher.id,
    body: "Which holes did you test, and how did each one feel? Add all three results.",
    createdAt: days(2),
  });

  // Print queue in several states
  const job = (studentKey: Key, title: string, status: (typeof s.printStatusEnum.enumValues)[number], extra: Partial<typeof s.printJobs.$inferInsert> = {}) => ({
    studentId: byKey[studentKey].id,
    courseId: course.id,
    lessonId: "make-it-fit",
    title,
    fileKey: `demo/${studentKey}-${title.toLowerCase().replace(/\W+/g, "-")}.stl`,
    fileName: `${title.toLowerCase().replace(/\W+/g, "-")}.stl`,
    sizeBytes: 48000,
    estimatedSize: "30 × 20 × 8 mm",
    status,
    history: [{ at: days(2).toISOString(), by: byKey[studentKey].id, from: "draft", to: "submitted" }],
    ...extra,
  });
  await db.insert(s.printJobs).values([
    job("luis", "Marker clip test ring", "submitted", { notes: "Only the ring — testing the 14.6 mm hole." }),
    job("ava", "Hook — flat orientation", "queued", { lessonId: "strength", printer: "Prusa MK4 #1", filament: "PLA white", estimatedMinutes: 22 }),
    job("maya", "Tolerance coupon", "printing", { lessonId: "tolerances", printer: "Bambu A1 mini #2", filament: "PLA blue", estimatedMinutes: 14 }),
    job("mia", "Snap lid v1", "failed", { lessonId: "make-it-fit", printer: "Prusa MK4 #2", failureReason: "Thin walls (0.6 mm) didn't print — try at least 1.2 mm.", estimatedMinutes: 35 }),
    job("jordan", "Die", "completed", { lessonId: "boss-die", printer: "Bambu A1 mini #1", estimatedMinutes: 40 }),
  ]);

  // Design journal for Ava
  await db.insert(s.designJournals).values({
    studentId: byKey.ava.id,
    courseId: course.id,
    projectKey: "cad-er",
    entries: {
      problem: "The phone stand tips backward and the phone doesn't fit in the slot.",
      test: "Put my phone (with case, 11.8 mm) in the slot — it didn't fit. Pushed the top — it tipped.",
      failed: "Slot is only 6 mm. The backrest is behind the base.",
      changed: "Made the slot 13 mm and moved the backrest forward so it sits over the base.",
    },
    revision: 4,
  });

  // A published Classroom assignment (fake Classroom in demo mode)
  await db.insert(s.assignments).values({
    courseId: course.id,
    activityId: "boss-die",
    title: "Boss Battle: The Mystery Die",
    instructions: "No tutorial — use every skill you have. Submit your share link and a screenshot of the dimensions.",
    points: 12,
    topic: "Boss Battles",
    dueAt: days(9),
    status: "local",
    createdBy: teacher.id,
  });

  await db.insert(s.notifications).values([
    { userId: byKey.mia.id, kind: "feedback", body: "Your teacher asked for a revision in Tolerances.", href: "/student/lessons/tolerances" },
    { userId: byKey.maya.id, kind: "badge", body: "Badge earned: Shape Wrangler", href: "/student/skills" },
  ]);
  return { org, teacher, course, students: byKey };
}

function alignSkillBlock(): string {
  // the first skill-check block in the align lesson
  const lesson = lessonsInPath("18-week").find((x) => x.lesson.id === "align")?.lesson;
  for (const sec of lesson?.sections ?? []) for (const b of sec.blocks) if ("check" in b && b.check === "skill") return b.id;
  return "skill-check";
}

/** Create a real (non-demo) organization. Used by `npm run db:seed -- --org`. */
export async function createOrganization(
  db: DB,
  input: { name: string; staffDomain?: string; studentDomain?: string; adminEmail?: string; adminName?: string },
) {
  const [org] = await db
    .insert(s.organizations)
    .values({
      name: input.name,
      googleDomain: input.staffDomain?.toLowerCase() ?? null,
      studentGoogleDomain: input.studentDomain?.toLowerCase() ?? null,
      settings: { studentUploadsEnabled: true, maxUploadMb: 25, adminCanViewStudentWork: false },
    })
    .returning();
  if (input.adminEmail) {
    const email = input.adminEmail.toLowerCase();
    const existing = await db.select().from(s.users).where(and(eq(s.users.organizationId, org.id), eq(s.users.email, email))).limit(1);
    if (!existing.length) await db.insert(s.users).values({ email, displayName: input.adminName ?? email.split("@")[0], role: "org_admin", organizationId: org.id });
  }
  return org;
}
