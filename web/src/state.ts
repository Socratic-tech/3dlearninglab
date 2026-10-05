import { useSyncExternalStore } from "react";
import { lessonStates } from "@/lib/progression";
import type { Me } from "./content";
import { pathLessons } from "./content";

/** Teachers and admins see every lesson open, whatever has been completed. */
export const isStaff = (me: Me) => me.user.role !== "student";

// ── Student view: staff can see the student experience exactly (locks, must-answer, no preview banner). ──
// Kept for this browser tab only, so a teacher never gets "stuck" in it on another day.
const SV_KEY = "academy.studentView";
const svListeners = new Set<() => void>();
let svMemory = false;
export function studentViewOn(): boolean {
  try { return sessionStorage.getItem(SV_KEY) === "1"; } catch { return svMemory; }
}
export function setStudentView(on: boolean) {
  svMemory = on;
  try { if (on) sessionStorage.setItem(SV_KEY, "1"); else sessionStorage.removeItem(SV_KEY); } catch { /* memory only */ }
  svListeners.forEach((f) => f());
}
export function useStudentView(): boolean {
  return useSyncExternalStore((f) => { svListeners.add(f); return () => { svListeners.delete(f); }; }, studentViewOn, () => false);
}
/** Staff powers apply, unless the teacher switched to student view. */
export const actsAsStaff = (me: Me) => isStaff(me) && !studentViewOn();

export function studentStates(me: Me) {
  const items = pathLessons(me.cls?.pathId ?? "18-week");
  const staff = actsAsStaff(me);
  const states = lessonStates({
    lessons: items.map((x) => ({ id: x.lesson.id, prerequisites: x.lesson.prerequisites })),
    enabled: () => true,
    manuallyUnlocked: () => staff || !!me.cls?.unlockAll,
    status: (id) => me.progress[id]?.status as "in_progress" | "completed" | undefined,
  });
  return { items, states };
}
