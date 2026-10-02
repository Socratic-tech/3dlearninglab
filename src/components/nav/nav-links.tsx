"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon: keyof typeof Icons; exact?: boolean };

function Icon({ name, className }: { name: NavItem["icon"]; className?: string }) {
  const C = Icons[name] as React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  return <C className={className} aria-hidden />;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function RailNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon name={item.icon} className="size-5 shrink-0" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold", active ? "text-primary" : "text-muted")}
            >
              <Icon name={item.icon} className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
