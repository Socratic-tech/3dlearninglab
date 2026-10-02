import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/session";
import { AppShell } from "@/components/nav/app-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("org_admin");
  return <AppShell nav={[{ href: "/admin", label: "School", icon: "Building2", exact: true }, { href: "/teacher", label: "Teach", icon: "Users" }]} user={user} roleLabel="School admin" home="/admin" demo={user.isDemo}>{children}</AppShell>;
}
