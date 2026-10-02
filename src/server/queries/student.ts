import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { notifications, studentBadges } from "../db/schema";
import { studentEnrollments, studentLessonStates } from "../services/courses";
import { getStudentLevels } from "../services/mastery";
import type { CurrentUser } from "../auth/session";

export const unreadCount = cache(async (userId: string) => {
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return n;
});

/** Everything the student pages need, memoised per request. */
export const studentContext = cache(async (user: CurrentUser, courseParam?: string | null) => {
  const db = await getDb();
  const enrollments = await studentEnrollments(db, user.id);
  const preferred = courseParam ?? (await cookies()).get("current_course")?.value;
  const current = enrollments.find((e) => e.course.id === preferred) ?? enrollments[0];
  const levels = await getStudentLevels(db, user.id);
  const badges = await db.select().from(studentBadges).where(eq(studentBadges.studentId, user.id));
  if (!current) return { db, enrollments, course: null, levels, badges, states: null, curriculum: [], progress: new Map() } as const;
  const { states, curriculum, progress } = await studentLessonStates(db, user.id, current.course);
  return { db, enrollments, course: current.course, enrollmentStatus: current.status, levels, badges, states, curriculum, progress } as const;
});
