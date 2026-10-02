import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, LogOut, Settings } from "lucide-react";
import { Logo } from "./logo";
import { BottomNav, RailNav, type NavItem } from "./nav-links";
import { signOutAction } from "@/app/actions/session";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({
  nav,
  user,
  roleLabel,
  home,
  unread = 0,
  topSlot,
  demo,
  children,
}: {
  nav: NavItem[];
  user: { displayName: string };
  roleLabel: string;
  home: string;
  unread?: number;
  topSlot?: ReactNode;
  demo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface px-3 py-4 lg:flex" aria-label="Primary">
        <div className="px-2 pb-6">
          <Logo href={home} />
        </div>
        <nav aria-label="Main navigation">
          <RailNav items={nav} />
        </nav>
        <div className="mt-auto space-y-1 border-t border-border pt-3">
          <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg">
            <Settings className="size-5" aria-hidden /> Settings
          </Link>
          <form action={signOutAction}>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg">
              <LogOut className="size-5" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        {demo && (
          <div className="bg-accent-soft px-4 py-1.5 text-center text-xs font-semibold text-accent">
            Demo mode — sample data only. <Link href="/demo" className="underline">Switch demo account</Link>
          </div>
        )}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Logo href={home} />
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">{topSlot}</div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/notifications" className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
              <Bell className="size-5" aria-hidden />
              {unread > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
            </Link>
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user.displayName}</p>
              <p className="text-xs leading-tight text-muted">{roleLabel}</p>
            </div>
            <Link href="/settings" className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden" aria-label="Settings">
              <Settings className="size-5" aria-hidden />
            </Link>
          </div>
        </header>
        {topSlot && <div className="border-b border-border px-4 py-2 lg:hidden">{topSlot}</div>}
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-12">
          {children}
        </main>
        <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <BottomNav items={nav.slice(0, 6)} />
        </nav>
      </div>
    </div>
  );
}
