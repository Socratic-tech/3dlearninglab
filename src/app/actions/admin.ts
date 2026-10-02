"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { run, str } from "./_run";
import { organizations, users } from "@/server/db/schema";
import { audit } from "@/server/services/audit";
import { AppError } from "@/server/errors";

export async function setRoleAction(userId: string, role: "student" | "teacher" | "org_admin") {
  return run(["org_admin"], async ({ db, actor }) => {
    if (userId === actor.id) throw new AppError("You can't change your own role.");
    const r = await db.update(users).set({ role: z.enum(["student", "teacher", "org_admin"]).parse(role) }).where(and(eq(users.id, userId), eq(users.organizationId, actor.organizationId))).returning();
    if (!r.length) throw new AppError("User not found.", 404);
    await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "user.role", targetType: "user", targetId: userId, metadata: { role } });
    refresh();
    return null;
  });
}

export async function orgSettingsAction(_p: unknown, fd: FormData) {
  return run(["org_admin"], async ({ db, actor }) => {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, actor.organizationId));
    await db.update(organizations).set({
      googleDomain: str(fd, "googleDomain", 100).toLowerCase() || null,
      studentGoogleDomain: str(fd, "studentGoogleDomain", 100).toLowerCase() || null,
      settings: { ...org.settings, studentUploadsEnabled: fd.get("uploads") === "on", adminCanViewStudentWork: fd.get("adminView") === "on", maxUploadMb: z.coerce.number().min(1).max(50).parse(str(fd, "maxUploadMb") || 25) },
    }).where(eq(organizations.id, actor.organizationId));
    await audit(db, { actorId: actor.id, organizationId: actor.organizationId, action: "org.settings" });
    refresh();
    return "Saved";
  });
}
