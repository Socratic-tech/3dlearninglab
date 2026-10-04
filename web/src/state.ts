import { lessonStates } from "@/lib/progression";
import type { Me } from "./content";
import { pathLessons } from "./content";

/** Teachers and admins see every lesson open, whatever has been completed. */
export const isStaff = (me: Me) => me.user.role !== "student";

export function studentStates(me: Me) {
  const items = pathLessons(me.cls?.pathId ?? "18-week");
  const staff = isStaff(me);
  const states = lessonStates({
    lessons: items.map((x) => ({ id: x.lesson.id, prerequisites: x.lesson.prerequisites })),
    enabled: () => true,
    manuallyUnlocked: () => staff || !!me.cls?.unlockAll,
    status: (id) => me.progress[id]?.status as "in_progress" | "completed" | undefined,
  });
  return { items, states };
}
