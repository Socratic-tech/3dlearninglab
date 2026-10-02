import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/session";
import { AppShell } from "@/components/nav/app-shell";
import type { NavItem } from "@/components/nav/nav-links";
import { studentContext, unreadCount } from "@/server/queries/student";
import { CourseSwitcher } from "@/components/student/course-switcher";

const NAV: NavItem[] = [
  { href: "/student", label: "Home", icon: "House", exact: true },
  { href: "/student/skills", label: "Skill Tree", icon: "Network" },
  { href: "/student/missions", label: "Missions", icon: "Map" },
  { href: "/student/designs", label: "Designs", icon: "Box" },
  { href: "/student/portfolio", label: "Portfolio", icon: "FolderOpen" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("student");
  const [ctx, unread] = await Promise.all([studentContext(user), unreadCount(user.id)]);
  return (
    <AppShell
      nav={NAV}
      user={user}
      roleLabel={ctx.course ? `${ctx.course.name}${ctx.course.section ? ` · ${ctx.course.section}` : ""}` : "Student"}
      home="/student"
      unread={unread}
      demo={user.isDemo}
      topSlot={ctx.enrollments.length > 1 ? <CourseSwitcher courses={ctx.enrollments.map((e) => ({ id: e.course.id, name: `${e.course.name}${e.course.section ? ` · ${e.course.section}` : ""}` }))} current={ctx.course?.id ?? ""} /> : null}
    >
      {children}
    </AppShell>
  );
}
