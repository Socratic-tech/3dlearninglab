import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/session";
import { AppShell } from "@/components/nav/app-shell";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("platform_admin");
  return <AppShell nav={[{ href: "/platform", label: "Platform", icon: "Wrench", exact: true }]} user={user} roleLabel="Platform admin" home="/platform" demo={user.isDemo}>{children}</AppShell>;
}
