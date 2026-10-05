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
// ── Test student only: open every mission so a teacher can check any lesson without finishing the ones before it.
const UNLOCK_KEY = "academy.previewUnlock";
const unlockListeners = new Set<() => void>();
let unlockMemory = false;
export function previewUnlockOn(): boolean {
  try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch { return unlockMemory; }
}
export function setPreviewUnlock(on: boolean) {
  unlockMemory = on;
  try { if (on) localStorage.setItem(UNLOCK_KEY, "1"); else localStorage.removeItem(UNLOCK_KEY); } catch { /* memory only */ }
  unlockListeners.forEach((f) => f());
}
export function usePreviewUnlock(): boolean {
  return useSyncExternalStore((f) => { unlockListeners.add(f); return () => { unlockListeners.delete(f); }; }, previewUnlockOn, () => false);
}

/** Saved copies and the upload queue are kept apart for the teacher and their test student. */
export const identityOf = (email: string | null) => (email && studentViewOn() ? email + "#student" : email);
/** Staff powers apply, unless the teacher switched to student view. */
export const actsAsStaff = (me: Me) => isStaff(me) && !studentViewOn();

export function studentStates(me: Me) {
  const items = pathLessons(me.cls?.pathId ?? "18-week");
  const staff = actsAsStaff(me);
  const states = lessonStates({
    lessons: items.map((x) => ({ id: x.lesson.id, prerequisites: x.lesson.prerequisites })),
    enabled: () => true,
    manuallyUnlocked: () => staff || !!me.cls?.unlockAll || (!!me.user.preview && previewUnlockOn()),
    status: (id) => me.progress[id]?.status as "in_progress" | "completed" | undefined,
  });
  return { items, states };
}
