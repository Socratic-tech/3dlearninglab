import "server-only";
import { and, eq, gte, inArray, sql, desc } from "drizzle-orm";
import type { DB } from "../db/client";
import { attempts, evidence, lessonProgress, printJobs, enrollments, users } from "../db/schema";
import { competencies, getCompetency, getLesson, heatmapGroups, allBlocks, type Proficiency } from "@/content";
import { groupLevel } from "@/lib/mastery";
import { assertTeacherOfCourse, type Actor } from "../policy";
import { courseCurriculum, getCourseForTeacher } from "./courses";
import { getLevelsForStudents } from "./mastery";

export type HelpSignal = { studentId: string; name: string; reason: string; href: string; kind: "attempts" | "revision" | "print" | "inactive" };

export async function classDashboard(db: DB, actor: Actor, courseId: string) {
  const course = await getCourseForTeacher(db, actor, courseId);
  const roster = await db
    .select({ id: users.id, name: users.displayName, status: enrollments.status })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(users.displayName);
  const active = roster.filter((r) => r.status === "active");
  const ids = active.map((r) => r.id);
  const nameOf = new Map(roster.map((r) => [r.id, r.name]));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const progress = ids.length ? await db.select().from(lessonProgress).where(and(eq(lessonProgress.courseId, courseId), inArray(lessonProgress.studentId, ids))) : [];
  const activeToday = new Set(progress.filter((p) => p.lastActivityAt && p.lastActivityAt >= startOfDay).map((p) => p.studentId));
  const lastActivity = new Map<string, Date>();
  for (const p of progress) if (p.lastActivityAt && (!lastActivity.get(p.studentId) || p.lastActivityAt > lastActivity.get(p.studentId)!)) lastActivity.set(p.studentId, p.lastActivityAt);

  const curriculum = (await courseCurriculum(db, course)).filter((c) => c.enabled);
  const completion = curriculum.map((c) => ({
    lessonId: c.lesson.id,
    title: c.lesson.title,
    week: c.week,
    completed: progress.filter((p) => p.lessonId === c.lesson.id && p.status === "completed").length,
    started: progress.filter((p) => p.lessonId === c.lesson.id && p.status !== "not_started").length,
  }));

  const awaitingReview = (await db.select({ n: sql<number>`count(*)::int` }).from(evidence).where(and(eq(evidence.courseId, courseId), eq(evidence.status, "submitted"))))[0]?.n ?? 0;
  const printCounts = await db
    .select({ status: printJobs.status, n: sql<number>`count(*)::int` })
    .from(printJobs)
    .where(eq(printJobs.courseId, courseId))
    .groupBy(printJobs.status);

  // ── Students who may need help (informational, never punitive) ──
  const help: HelpSignal[] = [];
  if (ids.length) {
    const skillBlocks = new Map<string, { lessonId: string; competencyId?: string }>();
    for (const c of curriculum)
      for (const b of allBlocks(c.lesson))
        if ("check" in b && b.check === "skill") skillBlocks.set(`${c.lesson.id}/${b.id}`, { lessonId: c.lesson.id, competencyId: "competencyId" in b ? b.competencyId : undefined });
    const att = await db
      .select({
        studentId: attempts.studentId,
        lessonId: attempts.lessonId,
        blockId: attempts.blockId,
        n: sql<number>`count(*)::int`,
        anyCorrect: sql<boolean>`bool_or(coalesce(${attempts.correct}, false))`,
      })
      .from(attempts)
      .where(and(eq(attempts.courseId, courseId), inArray(attempts.studentId, ids)))
      .groupBy(attempts.studentId, attempts.lessonId, attempts.blockId);
    for (const a of att) {
      const sb = skillBlocks.get(`${a.lessonId}/${a.blockId}`);
      if (sb && a.n >= 3 && !a.anyCorrect) {
        const comp = sb.competencyId ? getCompetency(sb.competencyId)?.title : getLesson(a.lessonId)?.title;
        help.push({ studentId: a.studentId, name: nameOf.get(a.studentId)!, reason: `${a.n} attempts on ${comp} skill check`, href: `/teacher/classes/${courseId}/students/${a.studentId}`, kind: "attempts" });
      }
    }
    const revisions = await db
      .select({ studentId: evidence.studentId, lessonId: evidence.lessonId })
      .from(evidence)
      .where(and(eq(evidence.courseId, courseId), eq(evidence.status, "needs_revision")));
    for (const r of revisions)
      help.push({ studentId: r.studentId, name: nameOf.get(r.studentId) ?? "Student", reason: `${getLesson(r.lessonId)?.title} — revision requested, not yet resubmitted`, href: `/teacher/classes/${courseId}/students/${r.studentId}`, kind: "revision" });
    const failedPrints = await db
      .select({ studentId: printJobs.studentId, title: printJobs.title, status: printJobs.status })
      .from(printJobs)
      .where(and(eq(printJobs.courseId, courseId), inArray(printJobs.status, ["failed", "needs_revision"])));
    for (const p of failedPrints)
      help.push({ studentId: p.studentId, name: nameOf.get(p.studentId) ?? "Student", reason: `Print “${p.title}” ${p.status === "failed" ? "failed" : "needs revision"}`, href: `/teacher/print-queue?course=${courseId}`, kind: "print" });
    const weekAgo = Date.now() - 7 * 864e5;
    const classActive = progress.some((p) => p.lastActivityAt && p.lastActivityAt.getTime() > weekAgo);
    if (classActive)
      for (const s of active) {
        const last = lastActivity.get(s.id);
        if (!last || last.getTime() < weekAgo) help.push({ studentId: s.id, name: s.name, reason: last ? "No activity in the last 7 days" : "Hasn't started yet", href: `/teacher/classes/${courseId}/students/${s.id}`, kind: "inactive" });
      }
  }

  // ── Common misconceptions (analytics, spec §48) ──
  const misconceptions = await db
    .select({ lessonId: attempts.lessonId, misconceptionId: attempts.misconceptionId, n: sql<number>`count(distinct ${attempts.studentId})::int` })
    .from(attempts)
    .where(and(eq(attempts.courseId, courseId), sql`${attempts.misconceptionId} is not null`))
    .groupBy(attempts.lessonId, attempts.misconceptionId)
    .orderBy(desc(sql`count(distinct ${attempts.studentId})`))
    .limit(6);

  const levels = await getLevelsForStudents(db, ids);
  const mastery = heatmapGroups.map((g) => {
    const vals = ids.map((id) => groupLevel(g.competencyIds.map((c) => levels.get(id)?.get(c) ?? "not_attempted")));
    return { id: g.id, label: g.label, proficient: vals.filter((v) => v === "proficient" || v === "independent").length, attempted: vals.filter((v) => v !== "not_attempted").length };
  });

  return {
    course,
    roster,
    activeCount: active.length,
    activeToday: activeToday.size,
    completion,
    awaitingReview,
    printCounts: Object.fromEntries(printCounts.map((p) => [p.status, p.n])) as Record<string, number>,
    help,
    misconceptions: misconceptions.map((m) => {
      const lesson = getLesson(m.lessonId);
      const text = lesson?.teacher.misconceptions.find((x) => x.id === m.misconceptionId);
      return { lessonTitle: lesson?.title ?? m.lessonId, text: text?.text ?? m.misconceptionId!, response: text?.response, students: m.n };
    }),
    mastery,
  };
}

export async function heatmap(db: DB, actor: Actor, courseId: string, mode: "groups" | "competencies") {
  await assertTeacherOfCourse(db, actor, courseId);
  const roster = await db
    .select({ id: users.id, name: users.displayName, status: enrollments.status })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(and(eq(enrollments.courseId, courseId), sql`${enrollments.status} <> 'archived'`))
    .orderBy(users.displayName);
  const levels = await getLevelsForStudents(db, roster.map((r) => r.id));
  const columns =
    mode === "groups"
      ? heatmapGroups.map((g) => ({ id: g.id, label: g.label, competencyIds: g.competencyIds }))
      : competencies.map((c) => ({ id: c.id, label: `${c.id} ${c.title}`, competencyIds: [c.id] }));
  const rows = roster.map((s) => ({
    student: s,
    cells: columns.map((col) => {
      const lv = col.competencyIds.map((c) => levels.get(s.id)?.get(c) ?? ("not_attempted" as Proficiency));
      return { columnId: col.id, level: mode === "groups" ? groupLevel(lv) : lv[0] };
    }),
  }));
  return { columns, rows };
}

export async function recentActivity(db: DB, courseIds: string[], since: Date) {
  if (!courseIds.length) return [];
  return db.select().from(lessonProgress).where(and(inArray(lessonProgress.courseId, courseIds), gte(lessonProgress.lastActivityAt, since)));
}
