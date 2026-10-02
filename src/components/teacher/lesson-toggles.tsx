"use client";

import { useTransition } from "react";
import { lessonSettingAction } from "@/app/actions/teacher";

export function LessonRow({ courseId, lessonId, title, week, enabled, dueAt, unlocked }: { courseId: string; lessonId: string; title: string; week: number; enabled: boolean; dueAt: string | null; unlocked: boolean }) {
  const [pending, start] = useTransition();
  const set = (patch: Parameters<typeof lessonSettingAction>[2]) => start(async () => void (await lessonSettingAction(courseId, lessonId, patch)));
  return (
    <tr className={pending ? "opacity-60" : ""}>
      <td className="py-1.5 pr-2 font-mono text-xs text-muted">W{week}</td>
      <th scope="row" className="py-1.5 pr-2 text-left font-semibold">{title}</th>
      <td className="py-1.5 pr-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => set({ enabled: e.target.checked })} /> <span className="sr-only">Enabled: {title}</span>On
        </label>
      </td>
      <td className="py-1.5 pr-2">
        <input type="date" aria-label={`Due date for ${title}`} defaultValue={dueAt?.slice(0, 10) ?? ""} onChange={(e) => set({ dueAt: e.target.value ? `${e.target.value}T23:59:00` : null })} className="h-8 rounded border border-border bg-surface px-2 text-sm" />
      </td>
      <td className="py-1.5">
        <label className="flex items-center gap-1.5 text-sm" title="Unlock regardless of prerequisites, e.g. when Tinkercad is unavailable">
          <input type="checkbox" checked={unlocked} onChange={(e) => set({ manuallyUnlocked: e.target.checked, unlockReason: e.target.checked ? "External tool unavailable" : null })} /> Unlock
        </label>
      </td>
    </tr>
  );
}
