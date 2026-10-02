import { eq } from "drizzle-orm";
import { createPgliteDb } from "@/server/db/pglite";
import { seedDemo } from "@/server/db/seed";
import * as s from "@/server/db/schema";
import type { DB } from "@/server/db/client";
import type { Actor } from "@/server/policy";

export async function freshDb(): Promise<DB> {
  return createPgliteDb();
}

export async function seededDb() {
  const db = await freshDb();
  const seed = await seedDemo(db);
  const actor = (u: { id: string; role: Actor["role"]; organizationId: string }): Actor => ({ id: u.id, role: u.role, organizationId: u.organizationId });
  return { db, seed, actor };
}

/** A second, unrelated organization with its own teacher, class and student. */
export async function otherOrg(db: DB) {
  const [org] = await db.insert(s.organizations).values({ name: "Other School" }).returning();
  const [teacher] = await db.insert(s.users).values({ email: "t@other.test", displayName: "Other Teacher", role: "teacher", organizationId: org.id }).returning();
  const [student] = await db.insert(s.users).values({ email: "s@other.test", displayName: "Other Student", role: "student", organizationId: org.id }).returning();
  const [course] = await db
    .insert(s.courses)
    .values({ organizationId: org.id, name: "Other", pathId: "9-week", joinCode: "OTHER1", equipment: { printerCount: 1, printerModels: "", material: "PLA", nozzleMm: 0.4, layerHeightMm: 0.2, studentDevices: "chromebook", calipersAvailable: false } })
    .returning();
  await db.insert(s.courseTeachers).values({ courseId: course.id, userId: teacher.id });
  await db.insert(s.enrollments).values({ courseId: course.id, userId: student.id });
  return { org, teacher, student, course };
}

export async function userByEmail(db: DB, email: string) {
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  return u;
}
