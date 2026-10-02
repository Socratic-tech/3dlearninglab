import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/nav/logo";
import { ThemeToggle } from "@/components/nav/theme-toggle";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Logo />
          <nav aria-label="Site" className="ml-auto flex items-center gap-1 text-sm font-semibold">
            <Link href="/curriculum" className="hidden rounded-lg px-3 py-2 hover:bg-surface-2 sm:block">
              Curriculum
            </Link>
            <Link href="/demo" className="hidden rounded-lg px-3 py-2 hover:bg-surface-2 sm:block">
              Explore demo
            </Link>
            <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-surface-2">
              Sign in
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4">
          <span>© {new Date().getFullYear()} 3D Design Academy</span>
          <Link href="/curriculum" className="hover:text-fg">Curriculum</Link>
          <Link href="/attributions" className="hover:text-fg">Attributions</Link>
          <Link href="/privacy" className="hover:text-fg">Privacy</Link>
          <span className="ml-auto">Tinkercad is a trademark of Autodesk, Inc. This product is not affiliated with Autodesk.</span>
        </div>
      </footer>
    </div>
  );
}
