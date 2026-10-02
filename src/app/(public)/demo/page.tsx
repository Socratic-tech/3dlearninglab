import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { GraduationCap, Shield, Users, Wrench } from "lucide-react";
import { getDb } from "@/server/db/client";
import { users, organizations } from "@/server/db/schema";
import { demoEnabled } from "@/server/env";
import { demoSignInAction } from "@/app/actions/session";
import { Alert } from "@/components/ui/card";

export const metadata: Metadata = { title: "Explore the demo" };

const ROLE_INFO = {
  teacher: { icon: Users, label: "Teacher", blurb: "Class dashboard, heatmap, review, print queue, Google Classroom (simulated)." },
  student: { icon: GraduationCap, label: "Student", blurb: "Skill tree, missions, lessons, 3D models, designs and portfolio." },
  org_admin: { icon: Shield, label: "School admin", blurb: "Teachers, privacy settings and aggregate usage." },
  platform_admin: { icon: Wrench, label: "Platform admin", blurb: "Curriculum validation, model licenses and releases." },
} as const;

export default async function DemoPage(props: PageProps<"/demo">) {
  const sp = await props.searchParams;
  if (!demoEnabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Alert tone="warning" title="The demo is turned off on this server." />
      </div>
    );
  }
  const db = await getDb();
  const people = await db
    .select({ email: users.email, name: users.displayName, role: users.role })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.organizationId))
    .where(and(eq(organizations.isDemo, true), eq(users.isDemo, true)));
  const order = ["teacher", "student", "org_admin", "platform_admin"] as const;
  const students = people.filter((p) => p.role === "student").slice(0, 5);
  const featured = [...people.filter((p) => p.role !== "student"), ...students].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Explore the demo</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pick an account. Everything is sample data in <strong>3D Design — Period 2</strong>; Google Classroom is simulated, so nothing is sent to Google. You can reset the demo at any time from Settings.
      </p>
      {sp.reset && (
        <div className="mt-4">
          <Alert tone="success">The demo has been reset.</Alert>
        </div>
      )}
      {sp.error && (
        <div className="mt-4">
          <Alert tone="danger">That demo account doesn&apos;t exist anymore — pick another.</Alert>
        </div>
      )}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {featured.map((p) => {
          const info = ROLE_INFO[p.role];
          return (
            <li key={p.email}>
              <form action={demoSignInAction}>
                <input type="hidden" name="email" value={p.email} />
                <button className="flex w-full items-start gap-4 rounded-2xl border border-border bg-surface p-4 text-left hover:border-primary focus-visible:border-primary">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <info.icon className="size-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-accent">{info.label}</span>
                    <span className="mt-1 block text-sm text-muted">{info.blurb}</span>
                  </span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
