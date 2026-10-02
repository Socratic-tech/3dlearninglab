"use client";

import { Moon } from "lucide-react";
import { useTransition } from "react";
import { setThemeAction } from "@/app/actions/session";

export function ThemeToggle() {
  const [, start] = useTransition();
  function toggle() {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    start(() => setThemeAction(next));
  }
  return (
    <button onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Switch between light and dark mode" title="Light / dark mode">
      <Moon className="size-5" aria-hidden />
    </button>
  );
}
