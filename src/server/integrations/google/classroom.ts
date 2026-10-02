import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { DB } from "../../db/client";
import { assignments, courseLessonSettings, courseTeachers, enrollments, googleCourseMappings, gradeSyncs, organizations, users } from "../../db/schema";
import { env, googleConfigured } from "../../env";
import { assertTeacherOfCourse, type Actor } from "../../policy";
import { AppError, IntegrationError, NotFoundError } from "../../errors";
import { audit } from "../../services/audit";
import { createCourse } from "../../services/courses";
import { assetsForLesson, getLesson } from "@/content";
import { ClassroomApiError, type ClassroomClient, type GCourseWorkInput, type GStudent } from "./types";
import { FakeClassroomClient } from "./fake-client";
import { HttpClassroomClient } from "./http-client";
import { getAccessToken, hasClassroomGrant } from "./oauth";

type UserLike = { id: string; isDemo: boolean; googleSub: string | null; displayName: string; email: string };

let factoryOverride: ((user: UserLike) => ClassroomClient) | undefined;
export function setClassroomFactoryForTests(f: typeof factoryOverride) {
  factoryOverride = f;
}

export function usesFakeClassroom(user: UserLike) {
  return user.isDemo || env.CLASSROOM_FAKE || !googleConfigured;
}

export function classroomFor(db: DB, user: UserLike): ClassroomClient {
  if (factoryOverride) return factoryOverride(user);
  if (usesFakeClassroom(user)) return new FakeClassroomClient(user.googleSub ?? user.id);
  return new HttpClassroomClient(() => getAccessToken(db, user.id));
}

export async function isClassroomConnected(db: DB, user: UserLike) {
  if (factoryOverride || usesFakeClassroom(user)) return true;
  return hasClassroomGrant(db, user.id);
}

/** Translate Google failures into friendly messages (spec §56). Local data is never modified on failure. */
function wrap(e: unknown, action: string): never {
  if (e instanceof AppError) throw e;
  const status = e instanceof ClassroomApiError ? e.status : 0;
  const msg =
    status === 401 || status === 403
      ? "Google Classroom said this account isn't allowed to do that. Check that you teach this class, or reconnect Google Classroom."
      : status === 404
        ? "That class or assignment no longer exists in Google Classroom."
        : status === 429
          ? "Google Classroom is busy right now. Wait a minute and try again."
          : "We couldn't update Google Classroom.";
  console.error(`[classroom] ${action} failed`, e);
  throw new IntegrationError(msg, "google-classroom", e);
}

async function mappingFor(db: DB, localCourseId: string) {
  const [m] = await db.select().from(googleCourseMappings).where(eq(googleCourseMappings.localCourseId, localCourseId)).limit(1);
  return m ?? null;
}

async function actorUser(db: DB, actor: Actor): Promise<UserLike> {
  const [u] = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
  if (!u) throw new NotFoundError("User");
  return u;
}

// ───────── Course listing & import ─────────

export async function listGoogleCourses(db: DB, actor: Actor) {
  const user = await actorUser(db, actor);
  const client = classroomFor(db, user);
  let list;
  try {
    list = await client.listCourses();
  } catch (e) {
    wrap(e, "listCourses");
  }
  const mapped = list.length
    ? await db
        .select({ googleCourseId: googleCourseMappings.googleCourseId, localCourseId: googleCourseMappings.localCourseId })
        .from(googleCourseMappings)
        .where(inArray(googleCourseMappings.googleCourseId, list.map((c) => c.id)))
    : [];
  const byGoogle = new Map(mapped.map((m) => [m.googleCourseId, m.localCourseId]));
  return list.map((c) => ({ ...c, linkedLocalCourseId: byGoogle.get(c.id) ?? null }));
}

export async function importGoogleCourses(db: DB, actor: Actor, input: { googleCourseIds: string[]; pathId: "9-week" | "18-week" }) {
  const user = await actorUser(db, actor);
  const client = classroomFor(db, user);
  const results: { googleCourseId: string; localCourseId: string; created: boolean }[] = [];
  for (const gid of input.googleCourseIds) {
    const existing = await db.select().from(googleCourseMappings).where(eq(googleCourseMappings.googleCourseId, gid)).limit(1);
    if (existing[0]) {
      results.push({ googleCourseId: gid, localCourseId: existing[0].localCourseId, created: false });
      continue;
    }
    let gc;
    try {
      gc = await client.getCourse(gid);
    } catch (e) {
      wrap(e, "getCourse");
    }
    const course = await createCourse(db, actor, { name: gc.name, section: gc.section ?? null, pathId: input.pathId });
    await db.insert(googleCourseMappings).values({
      localCourseId: course.id,
      googleCourseId: gid,
      googleTeacherId: user.googleSub ?? "me",
      connectedByUserId: actor.id,
      syncEnabled: true,
    });
    await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "classroom.import", targetType: "course", targetId: course.id, metadata: { googleCourseId: gid } });
    results.push({ googleCourseId: gid, localCourseId: course.id, created: true });
    try {
      await syncRoster(db, actor, course.id);
    } catch (e) {
      // The class is linked; the roster can be retried with "Sync Classroom".
      console.error("[classroom] initial roster sync failed", e);
    }
  }
  return results;
}

export async function linkExistingCourse(db: DB, actor: Actor, input: { localCourseId: string; googleCourseId: string }) {
  await assertTeacherOfCourse(db, actor, input.localCourseId);
  const user = await actorUser(db, actor);
  const taken = await db.select().from(googleCourseMappings).where(eq(googleCourseMappings.googleCourseId, input.googleCourseId)).limit(1);
  if (taken[0] && taken[0].localCourseId !== input.localCourseId) throw new AppError("That Google Classroom class is already connected to another class.");
  await db
    .insert(googleCourseMappings)
    .values({ localCourseId: input.localCourseId, googleCourseId: input.googleCourseId, googleTeacherId: user.googleSub ?? "me", connectedByUserId: actor.id })
    .onConflictDoUpdate({ target: googleCourseMappings.localCourseId, set: { googleCourseId: input.googleCourseId, syncEnabled: true } });
  return syncRoster(db, actor, input.localCourseId);
}

export async function setSyncEnabled(db: DB, actor: Actor, localCourseId: string, syncEnabled: boolean) {
  await assertTeacherOfCourse(db, actor, localCourseId);
  await db.update(googleCourseMappings).set({ syncEnabled }).where(eq(googleCourseMappings.localCourseId, localCourseId));
}

// ───────── Roster sync (idempotent) ─────────

export type RosterSyncResult = { added: number; updated: number; reactivated: number; markedNotInRoster: number; teachersAdded: number };

export async function syncRoster(db: DB, actor: Actor, localCourseId: string): Promise<RosterSyncResult> {
  await assertTeacherOfCourse(db, actor, localCourseId);
  const mapping = await mappingFor(db, localCourseId);
  if (!mapping) throw new AppError("This class isn't connected to Google Classroom.");
  const user = await actorUser(db, actor);
  const client = classroomFor(db, user);

  // 1) Read everything from Google FIRST. If any call fails, nothing local changes.
  let gStudents: GStudent[];
  let gTeachers: GStudent[];
  try {
    [gStudents, gTeachers] = await Promise.all([client.listStudents(mapping.googleCourseId), client.listTeachers(mapping.googleCourseId)]);
  } catch (e) {
    await db
      .update(googleCourseMappings)
      .set({ lastSyncStatus: "error", lastSyncError: e instanceof Error ? e.message.slice(0, 500) : "unknown" })
      .where(eq(googleCourseMappings.localCourseId, localCourseId));
    wrap(e, "syncRoster");
  }

  const [org] = await db.select().from(organizations).where(eq(organizations.id, actor.organizationId)).limit(1);
  const result: RosterSyncResult = { added: 0, updated: 0, reactivated: 0, markedNotInRoster: 0, teachersAdded: 0 };

  // 2) Apply in one transaction.
  await db.transaction(async (tx) => {
    const upsertPerson = async (p: GStudent, role: "student" | "teacher") => {
      const email = p.profile.emailAddress?.toLowerCase() ?? `${p.userId}@classroom.invalid`;
      const name = p.profile.name?.fullName ?? email.split("@")[0];
      const [bySub] = await tx.select().from(users).where(eq(users.googleSub, p.userId)).limit(1);
      if (bySub) {
        if (bySub.organizationId !== actor.organizationId) return null; // never pull users across organizations
        if (bySub.displayName !== name || bySub.email !== email) {
          await tx.update(users).set({ displayName: name, email }).where(eq(users.id, bySub.id));
          result.updated++;
        }
        return bySub;
      }
      const [byEmail] = await tx.select().from(users).where(and(eq(users.organizationId, actor.organizationId), eq(users.email, email))).limit(1);
      if (byEmail) {
        await tx.update(users).set({ googleSub: p.userId, displayName: name }).where(eq(users.id, byEmail.id));
        result.updated++;
        return byEmail;
      }
      const [created] = await tx
        .insert(users)
        .values({ googleSub: p.userId, email, displayName: name, role, organizationId: actor.organizationId, isDemo: org?.isDemo ?? false })
        .returning();
      if (role === "student") result.added++;
      return created;
    };

    const seen = new Set<string>();
    for (const s of gStudents) {
      const u = await upsertPerson(s, "student");
      if (!u || u.role !== "student") continue;
      seen.add(u.id);
      const [enr] = await tx.select().from(enrollments).where(and(eq(enrollments.courseId, localCourseId), eq(enrollments.userId, u.id))).limit(1);
      if (!enr) {
        await tx.insert(enrollments).values({ courseId: localCourseId, userId: u.id, status: "active", source: "google" });
      } else if (enr.status === "not_in_roster") {
        await tx.update(enrollments).set({ status: "active", statusChangedAt: new Date(), source: "google" }).where(and(eq(enrollments.courseId, localCourseId), eq(enrollments.userId, u.id)));
        result.reactivated++;
      }
      // archived enrollments stay archived: that was the teacher's decision
    }
    for (const t of gTeachers) {
      const u = await upsertPerson(t, "teacher");
      if (!u || u.role === "student") continue;
      const inserted = await tx.insert(courseTeachers).values({ courseId: localCourseId, userId: u.id, source: "google" }).onConflictDoNothing().returning();
      if (inserted.length) result.teachersAdded++;
    }
    // Students who left the Google roster: keep all progress, just flag them (spec §7).
    const current = await tx.select().from(enrollments).where(and(eq(enrollments.courseId, localCourseId), eq(enrollments.status, "active")));
    for (const e of current) {
      if (!seen.has(e.userId) && e.source === "google") {
        await tx.update(enrollments).set({ status: "not_in_roster", statusChangedAt: new Date() }).where(and(eq(enrollments.courseId, localCourseId), eq(enrollments.userId, e.userId)));
        result.markedNotInRoster++;
      }
    }
    await tx
      .update(googleCourseMappings)
      .set({ lastSyncedAt: new Date(), lastSyncStatus: "ok", lastSyncError: null })
      .where(eq(googleCourseMappings.localCourseId, localCourseId));
  });
  await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "classroom.roster_sync", targetType: "course", targetId: localCourseId, metadata: result });
  return result;
}

/** Periodic safe sync for all enabled mappings of a teacher (called on dashboard load at most every 6 hours). */
export async function syncStaleRosters(db: DB, actor: Actor, maxAgeMs = 6 * 3600_000) {
  const rows = await db
    .select({ m: googleCourseMappings })
    .from(googleCourseMappings)
    .innerJoin(courseTeachers, eq(courseTeachers.courseId, googleCourseMappings.localCourseId))
    .where(and(eq(courseTeachers.userId, actor.id), eq(googleCourseMappings.syncEnabled, true)));
  for (const { m } of rows) {
    if (m.lastSyncedAt && Date.now() - m.lastSyncedAt.getTime() < maxAgeMs) continue;
    try {
      await syncRoster(db, actor, m.localCourseId);
    } catch {
      // recorded on the mapping; local learning continues
    }
  }
}

// ───────── Publish coursework ─────────

export function activityLink(courseId: string, activityId: string) {
  if (activityId.startsWith("challenge:")) return `${env.APP_URL}/student/challenges/${activityId.slice(10)}?course=${courseId}`;
  return `${env.APP_URL}/student/lessons/${activityId}?course=${courseId}`;
}

export async function publishAssignment(
  db: DB,
  actor: Actor,
  input: { courseId: string; activityId: string; title: string; instructions: string; points: number | null; topic: string | null; dueAt: Date | null; gradeSyncMode?: "manual" | "auto" },
) {
  await assertTeacherOfCourse(db, actor, input.courseId);
  const mapping = await mappingFor(db, input.courseId);
  if (!mapping) throw new AppError("Connect this class to Google Classroom first (Class settings → Google Classroom).");
  const lesson = input.activityId.startsWith("challenge:") ? null : getLesson(input.activityId);
  if (!input.activityId.startsWith("challenge:") && !lesson) throw new NotFoundError("Lesson");
  if (input.points !== null && (input.points < 0 || input.points > 1000)) throw new AppError("Points must be between 0 and 1000.");

  // Duplicate prevention: one Classroom assignment per activity per class (unique index).
  const [existing] = await db.select().from(assignments).where(and(eq(assignments.courseId, input.courseId), eq(assignments.activityId, input.activityId))).limit(1);
  if (existing?.status === "published") throw new AppError("This activity is already assigned in Google Classroom for this class.", 409);
  if (existing?.status === "publishing" && Date.now() - existing.createdAt.getTime() < 60_000) throw new AppError("This assignment is already being published.", 409);

  let row = existing;
  const base = {
    title: input.title.trim().slice(0, 200) || lesson?.title || "Activity",
    instructions: input.instructions.slice(0, 4000),
    points: input.points,
    topic: input.topic?.trim() || null,
    dueAt: input.dueAt,
    gradeSyncMode: input.gradeSyncMode ?? "manual",
    status: "publishing" as const,
    lastError: null,
  };
  if (row) {
    [row] = await db.update(assignments).set(base).where(eq(assignments.id, row.id)).returning();
  } else {
    try {
      [row] = await db.insert(assignments).values({ courseId: input.courseId, activityId: input.activityId, createdBy: actor.id, ...base }).returning();
    } catch {
      throw new AppError("This activity is already assigned for this class.", 409);
    }
  }

  const user = await actorUser(db, actor);
  const client = classroomFor(db, user);
  const link = activityLink(input.courseId, input.activityId);
  const materials: GCourseWorkInput["materials"] = [{ link: { url: link, title: `Open in 3D Design Academy: ${base.title}` } }];
  if (lesson) {
    for (const a of assetsForLesson(lesson).filter((x) => x.localFilePath).slice(0, 5)) {
      materials.push({ link: { url: `${env.APP_URL}${a.localFilePath}`, title: `Model: ${a.title}` } });
    }
  }
  const cw: GCourseWorkInput = {
    title: base.title,
    description: `${base.instructions}\n\nOpen the activity: ${link}`.trim(),
    materials,
    workType: "ASSIGNMENT",
    state: "PUBLISHED",
    ...(base.points !== null ? { maxPoints: base.points } : {}),
  };
  if (base.dueAt) {
    const d = base.dueAt;
    cw.dueDate = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    cw.dueTime = { hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
  }
  try {
    if (base.topic) {
      const topics = await client.listTopics(mapping.googleCourseId);
      const t = topics.find((x) => x.name.toLowerCase() === base.topic!.toLowerCase()) ?? (await client.createTopic(mapping.googleCourseId, base.topic));
      cw.topicId = t.topicId;
    }
    const created = await client.createCourseWork(mapping.googleCourseId, cw);
    const [updated] = await db
      .update(assignments)
      .set({ status: "published", googleCourseId: mapping.googleCourseId, googleCourseWorkId: created.id, googleAlternateLink: created.alternateLink ?? null, lastError: null })
      .where(eq(assignments.id, row.id))
      .returning();
    if (lesson && base.dueAt) {
      await db
        .insert(courseLessonSettings)
        .values({ courseId: input.courseId, lessonId: lesson.id, dueAt: base.dueAt })
        .onConflictDoUpdate({ target: [courseLessonSettings.courseId, courseLessonSettings.lessonId], set: { dueAt: base.dueAt } });
    }
    await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "classroom.publish", targetType: "assignment", targetId: row.id, metadata: { courseWorkId: created.id } });
    return updated;
  } catch (e) {
    await db
      .update(assignments)
      .set({ status: "failed", lastError: e instanceof Error ? e.message.slice(0, 500) : "unknown" })
      .where(eq(assignments.id, row.id));
    wrap(e, "publishAssignment");
  }
}

/** Keep our record in step with Classroom (e.g. the teacher deleted the assignment there). */
export async function refreshAssignment(db: DB, actor: Actor, assignmentId: string) {
  const [a] = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
  if (!a) throw new NotFoundError("Assignment");
  await assertTeacherOfCourse(db, actor, a.courseId);
  if (!a.googleCourseId || !a.googleCourseWorkId) return a;
  const client = classroomFor(db, await actorUser(db, actor));
  try {
    const cw = await client.getCourseWork(a.googleCourseId, a.googleCourseWorkId);
    if (!cw) {
      const [u] = await db
        .update(assignments)
        .set({ status: "local", googleCourseWorkId: null, googleAlternateLink: null, lastError: "Deleted in Google Classroom" })
        .where(eq(assignments.id, a.id))
        .returning();
      return u;
    }
    return a;
  } catch (e) {
    wrap(e, "refreshAssignment");
  }
}

// ───────── Grades ─────────

export async function sendGrade(db: DB, actor: Actor, input: { assignmentId: string; studentId: string; score: number; returnToStudent?: boolean }) {
  const [a] = await db.select().from(assignments).where(eq(assignments.id, input.assignmentId)).limit(1);
  if (!a) throw new NotFoundError("Assignment");
  await assertTeacherOfCourse(db, actor, a.courseId);
  if (a.status !== "published" || !a.googleCourseId || !a.googleCourseWorkId) throw new AppError("Publish this assignment to Google Classroom before sending grades.");
  if (!Number.isFinite(input.score) || input.score < 0 || (a.points !== null && input.score > a.points)) throw new AppError(`Score must be between 0 and ${a.points ?? "the maximum"}.`);
  const [student] = await db
    .select({ id: users.id, googleSub: users.googleSub })
    .from(users)
    .innerJoin(enrollments, and(eq(enrollments.userId, users.id), eq(enrollments.courseId, a.courseId)))
    .where(eq(users.id, input.studentId))
    .limit(1);
  if (!student) throw new NotFoundError("Student");
  if (!student.googleSub) throw new AppError("This student isn't linked to a Google account yet (they need to sign in with Google or be imported from Classroom).");
  const client = classroomFor(db, await actorUser(db, actor));
  try {
    const subs = await client.listSubmissions(a.googleCourseId, a.googleCourseWorkId, student.googleSub);
    const sub = subs[0];
    if (!sub) throw new AppError("Google Classroom has no submission for this student yet (were they added to the class after it was assigned?).");
    await client.setGrade(a.googleCourseId, a.googleCourseWorkId, sub.id, input.score);
    if (input.returnToStudent) await client.returnSubmission(a.googleCourseId, a.googleCourseWorkId, sub.id);
    await db
      .insert(gradeSyncs)
      .values({ assignmentId: a.id, studentId: student.id, score: input.score, status: "synced", googleSubmissionId: sub.id, syncedAt: new Date(), error: null })
      .onConflictDoUpdate({ target: [gradeSyncs.assignmentId, gradeSyncs.studentId], set: { score: input.score, status: "synced", googleSubmissionId: sub.id, syncedAt: new Date(), error: null, updatedAt: new Date() } });
    await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "classroom.grade", targetType: "assignment", targetId: a.id, metadata: { studentId: student.id, score: input.score } });
  } catch (e) {
    await db
      .insert(gradeSyncs)
      .values({ assignmentId: a.id, studentId: student.id, score: input.score, status: "failed", error: e instanceof Error ? e.message.slice(0, 500) : "unknown" })
      .onConflictDoUpdate({ target: [gradeSyncs.assignmentId, gradeSyncs.studentId], set: { score: input.score, status: "failed", error: e instanceof Error ? e.message.slice(0, 500) : "unknown", updatedAt: new Date() } });
    wrap(e, "sendGrade");
  }
}

export async function assignmentsForCourse(db: DB, actor: Actor, courseId: string) {
  await assertTeacherOfCourse(db, actor, courseId);
  const rows = await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  const syncs = rows.length ? await db.select().from(gradeSyncs).where(inArray(gradeSyncs.assignmentId, rows.map((r) => r.id))) : [];
  return rows.map((r) => ({ ...r, grades: syncs.filter((s) => s.assignmentId === r.id) }));
}

export async function courseIsLinked(db: DB, courseId: string) {
  return Boolean(await mappingFor(db, courseId));
}

