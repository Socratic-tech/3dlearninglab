"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { users, organizations } from "@/server/db/schema";
import { homeFor, signIn, signOut, requireUser } from "@/server/auth/session";
import { demoEnabled } from "@/server/env";
import { resetDemo } from "@/server/db/seed";
import { PREFS_COOKIE, parsePrefs, type UiPrefs } from "@/lib/prefs";

/** Demo login: only for users of the demo organization, and only when demo mode is enabled. */
export async function demoSignInAction(formData: FormData) {
  if (!demoEnabled) redirect("/login?error=demo-disabled");
  const email = String(formData.get("email") ?? "");
  const db = await getDb();
  const [row] = await db
    .select({ user: users })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.organizationId))
    .where(and(eq(users.email, email), eq(users.isDemo, true), eq(organizations.isDemo, true)))
    .limit(1);
  if (!row) redirect("/demo?error=unknown");
  await signIn(db, row.user.id);
  redirect(homeFor(row.user.role));
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}

export async function resetDemoAction() {
  const user = await requireUser();
  if (!demoEnabled || !user.isDemo) redirect("/");
  const db = await getDb();
  await resetDemo(db);
  await signOut();
  redirect("/demo?reset=1");
}

export async function savePrefsAction(formData: FormData) {
  const jar = await cookies();
  const current = parsePrefs(jar.get(PREFS_COOKIE)?.value);
  const next: UiPrefs = parsePrefs(
    JSON.stringify({
      theme: formData.get("theme") ?? current.theme,
      text: formData.get("text") ?? current.text,
      readable: formData.has("readable") ? formData.get("readable") === "on" || formData.get("readable") === "true" : formData.has("_form") ? false : current.readable,
      motion: formData.get("motion") ?? (formData.has("_form") ? "system" : current.motion),
    }),
  );
  jar.set(PREFS_COOKIE, JSON.stringify(next), { path: "/", maxAge: 365 * 86400, sameSite: "lax", httpOnly: false });
}

export async function setThemeAction(theme: "light" | "dark") {
  const jar = await cookies();
  const current = parsePrefs(jar.get(PREFS_COOKIE)?.value);
  jar.set(PREFS_COOKIE, JSON.stringify({ ...current, theme: theme === "dark" ? "dark" : "light" }), { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
}
