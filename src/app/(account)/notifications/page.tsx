import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { markNotificationsReadAction } from "@/app/actions/student";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Notifications" };

export default async function Notifications() {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50);
  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          rows.some((r) => !r.readAt) ? (
            <form action={async () => { "use server"; await markNotificationsReadAction(); }}>
              <Button variant="secondary" size="sm">Mark all read</Button>
            </form>
          ) : null
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="You're all caught up" />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {rows.map((n) => (
            <li key={n.id} className="flex items-start gap-3 p-4">
              {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              <div className="flex-1">
                {n.href ? <Link href={n.href} className="font-semibold hover:text-primary">{n.body}</Link> : <p className="font-semibold">{n.body}</p>}
                <p className="text-xs text-muted">{n.createdAt.toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
