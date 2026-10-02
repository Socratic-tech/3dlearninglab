import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser, homeFor } from "@/server/auth/session";
import { Logo } from "@/components/nav/logo";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center gap-4 border-b border-border px-4">
        <Logo href={homeFor(user.role)} />
        <Link href={homeFor(user.role)} className="ml-auto text-sm font-semibold text-primary underline">
          Back to dashboard
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
