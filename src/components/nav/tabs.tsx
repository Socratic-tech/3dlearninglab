"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function TabNav({ tabs, label }: { tabs: [string, string][]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map(([text, href], i) => {
        const active = i === 0 ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold", active ? "border-primary text-primary" : "border-transparent text-muted hover:text-fg")}>
            {text}
          </Link>
        );
      })}
    </nav>
  );
}
