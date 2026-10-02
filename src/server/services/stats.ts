import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import type { DB } from "../db/client";
import { attempts, evidence, lessonProgress } from "../db/schema";
import { computeStats, type Stats, type XpEvent } from "@/lib/streaks";

/** XP, streak and daily goal for one student in one class (derived; nothing extra stored). */
export async function studentStats(db: DB, studentId: string, courseId: string): Promise<Stats> {
  const [a, e, l] = await Promise.all([
    db.select({ at: attempts.createdAt, lessonId: attempts.lessonId, blockId: attempts.blockId, correct: attempts.correct }).from(attempts).where(and(eq(attempts.studentId, studentId), eq(attempts.courseId, courseId))),
    db.select({ at: evidence.createdAt, lessonId: evidence.lessonId, blockId: evidence.blockId }).from(evidence).where(and(eq(evidence.studentId, studentId), eq(evidence.courseId, courseId))),
    db.select({ at: lessonProgress.completedAt, lessonId: lessonProgress.lessonId }).from(lessonProgress).where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.courseId, courseId), isNotNull(lessonProgress.completedAt))),
  ]);
  const events: XpEvent[] = [
    ...a.map((x) => ({ kind: "attempt" as const, at: x.at, lessonId: x.lessonId, blockId: x.blockId, correct: x.correct })),
    ...e.map((x) => ({ kind: "work" as const, at: x.at, lessonId: x.lessonId, blockId: x.blockId ?? x.lessonId })),
    ...l.map((x) => ({ kind: "lesson" as const, at: x.at!, lessonId: x.lessonId })),
  ];
  return computeStats(events, { timeZone: process.env.SCHOOL_TIME_ZONE || "America/Detroit" });
}
