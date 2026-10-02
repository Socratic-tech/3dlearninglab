"use client";

import { useTransition } from "react";
import { selectCourseAction } from "@/app/actions/student";

export function CourseSwitcher({ courses, current }: { courses: { id: string; name: string }[]; current: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Class</span>
      <select
        className="h-9 rounded-lg border border-border bg-surface px-2"
        value={current}
        disabled={pending}
        onChange={(e) => start(() => selectCourseAction(e.target.value))}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
