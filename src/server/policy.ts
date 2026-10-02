import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { DB } from "./db/client";
import { courseTeachers, courses, enrollments, users, organizations, printJobs } from "./db/schema";
import { ForbiddenError, NotFoundError } from "./errors";

/**
 * Every authorization rule lives here (spec §39: never rely on hiding UI controls).
 * Functions either return a boolean (`can*`) or throw ForbiddenError (`assert*`).
 */
export type Actor = { id: string; role: "student" | "teacher" | "org_admin" | "platform_admin"; organizationId: string };

export async function isTeacherOfCourse(db: DB, actor: Actor, courseId: string): Promise<boolean> {
  if (actor.role === "student") return false;
  const rows = await db
    .select({ c: courseTeachers.courseId })
    .from(courseTeachers)
    .innerJoin(courses, eq(courses.id, courseTeachers.courseId))
    .where(and(eq(courseTeachers.courseId, courseId), eq(courseTeachers.userId, actor.id), eq(courses.organizationId, actor.organizationId)))
    .limit(1);
  return rows.length > 0;
}

export async function isStudentInCourse(db: DB, actor: Actor, courseId: string): Promise<boolean> {
  if (actor.role !== "student") return false;
  const rows = await db
    .select({ s: enrollments.status })
    .from(enrollments)
    .where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, actor.id)))
    .limit(1);
  // A student removed from the Google roster keeps access to their own past work but cannot be archived out silently.
  return rows.length > 0 && rows[0].s !== "archived";
}

export async function assertTeacherOfCourse(db: DB, actor: Actor, courseId: string) {
  if (!(await isTeacherOfCourse(db, actor, courseId))) throw new ForbiddenError({ actor: actor.id, courseId });
}

export async function assertStudentInCourse(db: DB, actor: Actor, courseId: string) {
  if (!(await isStudentInCourse(db, actor, courseId))) throw new ForbiddenError({ actor: actor.id, courseId });
}

/** Can the actor see this student's private work (evidence, reflections, journal, proficiency)? */
export async function canViewStudentWork(db: DB, actor: Actor, studentId: string): Promise<boolean> {
  if (actor.id === studentId) return true;
  if (actor.role === "student") return false;
  const [student] = await db.select({ org: users.organizationId, role: users.role }).from(users).where(eq(users.id, studentId)).limit(1);
  if (!student || student.org !== actor.organizationId || student.role !== "student") return false;
  if (actor.role === "teacher" || actor.role === "org_admin" || actor.role === "platform_admin") {
    // Teachers: only students enrolled (any status) in a course they teach.
    const shared = await db
      .select({ c: enrollments.courseId })
      .from(enrollments)
      .innerJoin(courseTeachers, eq(courseTeachers.courseId, enrollments.courseId))
      .where(and(eq(enrollments.userId, studentId), eq(courseTeachers.userId, actor.id)))
      .limit(1);
    if (shared.length) return true;
  }
  if (actor.role === "org_admin") {
    // Spec §4: do not expose student-level work to administrators unless the organization opted in.
    const [org] = await db.select({ settings: organizations.settings }).from(organizations).where(eq(organizations.id, actor.organizationId)).limit(1);
    return Boolean(org?.settings.adminCanViewStudentWork);
  }
  return false;
}

export async function assertCanViewStudentWork(db: DB, actor: Actor, studentId: string) {
  if (!(await canViewStudentWork(db, actor, studentId))) throw new ForbiddenError({ actor: actor.id, studentId });
}

/** Teacher of the course that owns a piece of student work in that course. */
export async function assertCanReviewInCourse(db: DB, actor: Actor, courseId: string, studentId: string) {
  await assertTeacherOfCourse(db, actor, courseId);
  const rows = await db
    .select({ s: enrollments.status })
    .from(enrollments)
    .where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, studentId)))
    .limit(1);
  if (!rows.length) throw new ForbiddenError({ actor: actor.id, courseId, studentId });
}

// ───────── Print queue ─────────

export type PrintStatus = (typeof printJobs.$inferSelect)["status"];

const TEACHER_TRANSITIONS: Record<PrintStatus, PrintStatus[]> = {
  draft: ["submitted"],
  submitted: ["needs_revision", "approved", "queued"],
  needs_revision: ["submitted", "approved"],
  approved: ["queued", "needs_revision"],
  queued: ["printing", "approved", "failed"],
  printing: ["completed", "failed"],
  completed: ["queued"],
  failed: ["queued", "needs_revision"],
};
const STUDENT_TRANSITIONS: Partial<Record<PrintStatus, PrintStatus[]>> = {
  draft: ["submitted"],
  submitted: ["draft"],
  needs_revision: ["submitted"],
};

export function allowedPrintTransitions(role: "student" | "teacher", from: PrintStatus): PrintStatus[] {
  return role === "teacher" ? TEACHER_TRANSITIONS[from] : (STUDENT_TRANSITIONS[from] ?? []);
}

export async function assertCanTransitionPrintJob(db: DB, actor: Actor, jobId: string, to: PrintStatus) {
  const [job] = await db.select().from(printJobs).where(eq(printJobs.id, jobId)).limit(1);
  if (!job) throw new NotFoundError("Print job");
  const teacher = await isTeacherOfCourse(db, actor, job.courseId);
  if (teacher) {
    if (!allowedPrintTransitions("teacher", job.status).includes(to)) throw new ForbiddenError({ from: job.status, to });
    return { job, as: "teacher" as const };
  }
  if (actor.id === job.studentId && allowedPrintTransitions("student", job.status).includes(to)) return { job, as: "student" as const };
  throw new ForbiddenError({ actor: actor.id, jobId, to });
}

/** Courses the actor teaches (ids). */
export async function taughtCourseIds(db: DB, actor: Actor): Promise<string[]> {
  if (actor.role === "student") return [];
  const rows = await db
    .select({ id: courseTeachers.courseId })
    .from(courseTeachers)
    .innerJoin(courses, eq(courses.id, courseTeachers.courseId))
    .where(and(eq(courseTeachers.userId, actor.id), eq(courses.organizationId, actor.organizationId)));
  return rows.map((r) => r.id);
}

export async function assertSameOrganization(db: DB, actor: Actor, userIds: string[]) {
  if (!userIds.length) return;
  const rows = await db.select({ id: users.id, org: users.organizationId }).from(users).where(inArray(users.id, userIds));
  if (rows.length !== userIds.length || rows.some((r) => r.org !== actor.organizationId)) throw new ForbiddenError({ userIds });
}

export function assertRole(actor: Actor, ...roles: Actor["role"][]) {
  if (!roles.includes(actor.role)) throw new ForbiddenError({ actor: actor.id, need: roles });
}
