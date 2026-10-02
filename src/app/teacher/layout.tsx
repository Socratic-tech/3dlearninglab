import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/session";
import { AppShell } from "@/components/nav/app-shell";
import type { NavItem } from "@/components/nav/nav-links";
import { unreadCount } from "@/server/queries/student";

const NAV: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: "LayoutDashboard", exact: true },
  { href: "/teacher/classes", label: "Classes", icon: "Users" },
  { href: "/teacher/curriculum", label: "Curriculum", icon: "BookOpen" },
  { href: "/teacher/students", label: "Students", icon: "GraduationCap" },
  { href: "/teacher/print-queue", label: "Print Queue", icon: "Printer" },
  { href: "/teacher/resources", label: "Resources", icon: "Library" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("teacher", "org_admin");
  return (
    <AppShell nav={NAV} user={user} roleLabel={user.role === "org_admin" ? "Admin · Teacher" : "Teacher"} home="/teacher" unread={await unreadCount(user.id)} demo={user.isDemo}>
      {children}
    </AppShell>
  );
}
