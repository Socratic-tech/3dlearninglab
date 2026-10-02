import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import {
  courses,
  courseTeachers,
  enrollments,
  courseLessonSettings,
  lessonProgress,
  users,
  googleCourseMappings,
  type EquipmentConfig,
} from "../db/schema";
import { lessonsInPath, getLesson, type Lesson, type PrintLevel } from "@/content";
import { lessonStates, type LessonState } from "@/lib/progression";
import { assertTeacherOfCourse, type Actor } from "../policy";
import { joinCode } from "../crypto";
import { AppError, NotFoundError } from "../errors";
import { audit } from "./audit";

export type Course = typeof courses.$inferSelect;

export const DEFAULT_EQUIPMENT: EquipmentConfig = {
  printerCount: 2,
  printerModels: "",
  material: "PLA",
  nozzleMm: 0.4,
  layerHeightMm: 0.2,
  studentDevices: "chromebook",
  calipersAvailable: true,
};

export async function createCourse(
  db: DB,
  actor: Actor,
  input: { name: string; section?: string | null; pathId: "9-week" | "18-week"; equipment?: Partial<EquipmentConfig> },
): Promise<Course> {
  if (actor.role === "student") throw new AppError("Only teachers can create classes.", 403);
  const name = input.name.trim();
  if (!name) throw new AppError("Give the class a name.");
  return db.transaction(async (tx) => {
    let code = joinCode();
    for (let i = 0; i < 5; i++) {
      const exists = await tx.select({ id: courses.id }).from(courses).where(eq(courses.joinCode, code)).limit(1);
      if (!exists.length) break;
      code = joinCode();
    }
    const [course] = await tx
      .insert(courses)
      .values({
        organizationId: actor.organizationId,
        name,
        section: input.section ?? null,
        pathId: input.pathId,
        equipment: { ...DEFAULT_EQUIPMENT, ...input.equipment },
        joinCode: code,
      })
      .returning();
    await tx.insert(courseTeachers).values({ courseId: course.id, userId: actor.id });
    await audit(tx as unknown as DB, { actorId: actor.id, organizationId: actor.organizationId, action: "course.create", targetType: "course", targetId: course.id });
    return course;
  });
}

export async function teacherCourses(db: DB, actor: Actor) {
  const rows = await db
    .select({ course: courses, mapping: googleCourseMappings })
    .from(courseTeachers)
    .innerJoin(courses, eq(courses.id, courseTeachers.courseId))
    .leftJoin(googleCourseMappings, eq(googleCourseMappings.localCourseId, courses.id))
    .where(and(eq(courseTeachers.userId, actor.id), eq(courses.organizationId, actor.organizationId), isNull(courses.archivedAt)))
    .orderBy(asc(courses.name));
  const counts = rows.length
    ? await db
        .select({ courseId: enrollments.courseId, n: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(and(inArray(enrollments.courseId, rows.map((r) => r.course.id)), eq(enrollments.status, "active")))
        .groupBy(enrollments.courseId)
    : [];
  const countMap = new Map(counts.map((c) => [c.courseId, c.n]));
  return rows.map((r) => ({ ...r.course, mapping: r.mapping, studentCount: countMap.get(r.course.id) ?? 0 }));
}

export async function getCourseForTeacher(db: DB, actor: Actor, courseId: string) {
  await assertTeacherOfCourse(db, actor, courseId);
  const [row] = await db
    .select({ course: courses, mapping: googleCourseMappings })
    .from(courses)
    .leftJoin(googleCourseMappings, eq(googleCourseMappings.localCourseId, courses.id))
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!row) throw new NotFoundError("Class");
  return { ...row.course, mapping: row.mapping };
}

export async function courseRoster(db: DB, courseId: string) {
  return db
    .select({ id: users.id, displayName: users.displayName, email: users.email, status: enrollments.status, source: enrollments.source })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(asc(users.displayName));
}

export async function studentEnrollments(db: DB, studentId: string) {
  return db
    .select({ course: courses, status: enrollments.status })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.userId, studentId), isNull(courses.archivedAt), sql`${enrollments.status} <> 'archived'`))
    .orderBy(asc(courses.name));
}

export async function joinCourseByCode(db: DB, actor: Actor, code: string) {
  if (actor.role !== "student") throw new AppError("Only students join classes with a code.");
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.joinCode, code.trim().toUpperCase()), eq(courses.organizationId, actor.organizationId), isNull(courses.archivedAt)))
    .limit(1);
  if (!course) throw new AppError("We couldn't find a class with that code. Check it with your teacher.", 404);
  await db
    .insert(enrollments)
    .values({ courseId: course.id, userId: actor.id, status: "active", source: "join_code" })
    .onConflictDoUpdate({ target: [enrollments.courseId, enrollments.userId], set: { status: "active", statusChangedAt: new Date() } });
  return course;
}

export type CourseLessonSetting = typeof courseLessonSettings.$inferSelect;

export async function lessonSettingsFor(db: DB, courseId: string) {
  const rows = await db.select().from(courseLessonSettings).where(eq(courseLessonSettings.courseId, courseId));
  return new Map(rows.map((r) => [r.lessonId, r]));
}

/** Lessons of the course's path with per-course overrides applied. */
export async function courseCurriculum(db: DB, course: Pick<Course, "id" | "pathId">) {
  const settings = await lessonSettingsFor(db, course.id);
  return lessonsInPath(course.pathId).map(({ lesson, week }) => {
    const s = settings.get(lesson.id);
    return {
      lesson,
      week,
      enabled: s?.enabled ?? true,
      dueAt: s?.dueAt ?? null,
      printLevel: (s?.printLevel as PrintLevel | null) ?? lesson.printLevel,
      manuallyUnlocked: s?.manuallyUnlocked ?? false,
      unlockReason: s?.unlockReason ?? null,
    };
  });
}

export type CurriculumEntry = Awaited<ReturnType<typeof courseCurriculum>>[number];

export async function studentLessonStates(db: DB, studentId: string, course: Pick<Course, "id" | "pathId">) {
  const curriculum = await courseCurriculum(db, course);
  const progress = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.courseId, course.id)));
  const pmap = new Map(progress.map((p) => [p.lessonId, p]));
  const cmap = new Map(curriculum.map((c) => [c.lesson.id, c]));
  const states = lessonStates({
    lessons: curriculum.map((c) => ({ id: c.lesson.id, prerequisites: c.lesson.prerequisites })),
    enabled: (id) => cmap.get(id)?.enabled ?? false,
    manuallyUnlocked: (id) => cmap.get(id)?.manuallyUnlocked ?? false,
    status: (id) => pmap.get(id)?.status,
  });
  return {
    curriculum: curriculum.filter((c) => c.enabled),
    states,
    progress: pmap,
  };
}

export async function updateCourseSettings(
  db: DB,
  actor: Actor,
  courseId: string,
  input: Partial<{ name: string; section: string | null; pathId: "9-week" | "18-week"; tinkercadClassUrl: string | null; equipment: EquipmentConfig; startDate: Date | null }>,
) {
  await assertTeacherOfCourse(db, actor, courseId);
  if (input.tinkercadClassUrl) {
    let u: URL;
    try {
      u = new URL(input.tinkercadClassUrl);
    } catch {
      throw new AppError("That doesn't look like a web address.");
    }
    if (u.protocol !== "https:" || !/(^|\.)tinkercad\.com$/.test(u.hostname)) throw new AppError("Use a https://www.tinkercad.com link for your Tinkercad Classroom.");
  }
  await db.update(courses).set(input).where(eq(courses.id, courseId));
  await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "course.update", targetType: "course", targetId: courseId, metadata: { fields: Object.keys(input) } });
}

export async function setLessonSetting(
  db: DB,
  actor: Actor,
  courseId: string,
  lessonId: string,
  patch: Partial<{ enabled: boolean; dueAt: Date | null; printLevel: PrintLevel | null; manuallyUnlocked: boolean; unlockReason: string | null }>,
) {
  await assertTeacherOfCourse(db, actor, courseId);
  if (!getLesson(lessonId)) throw new NotFoundError("Lesson");
  await db
    .insert(courseLessonSettings)
    .values({ courseId, lessonId, ...patch })
    .onConflictDoUpdate({ target: [courseLessonSettings.courseId, courseLessonSettings.lessonId], set: patch });
  await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "course.lesson_setting", targetType: "course", targetId: courseId, metadata: { lessonId, ...patch } });
}

export async function addStudentManually(db: DB, actor: Actor, courseId: string, input: { displayName: string; email: string }) {
  await assertTeacherOfCourse(db, actor, courseId);
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AppError("Enter a valid school email address.");
  const [existing] = await db.select().from(users).where(and(eq(users.organizationId, actor.organizationId), eq(users.email, email))).limit(1);
  if (existing && existing.role !== "student") throw new AppError("That email belongs to a staff account.");
  const student =
    existing ??
    (await db.insert(users).values({ email, displayName: input.displayName.trim() || email.split("@")[0], role: "student", organizationId: actor.organizationId }).returning())[0];
  await db
    .insert(enrollments)
    .values({ courseId, userId: student.id, status: "active", source: "local" })
    .onConflictDoUpdate({ target: [enrollments.courseId, enrollments.userId], set: { status: "active", statusChangedAt: new Date() } });
  return student;
}

export async function setEnrollmentStatus(db: DB, actor: Actor, courseId: string, studentId: string, status: "active" | "archived") {
  await assertTeacherOfCourse(db, actor, courseId);
  await db
    .update(enrollments)
    .set({ status, statusChangedAt: new Date() })
    .where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, studentId)));
  await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: `enrollment.${status}`, targetType: "student", targetId: studentId, metadata: { courseId } });
}

export function lessonFor(id: string): Lesson {
  const l = getLesson(id);
  if (!l) throw new NotFoundError("Lesson");
  return l;
}

export type { LessonState };
