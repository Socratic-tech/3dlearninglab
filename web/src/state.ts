import { lessonStates } from "@/lib/progression";
import type { Me } from "./content";
import { pathLessons } from "./content";

export function studentStates(me: Me) {
  const items = pathLessons(me.cls.pathId);
  const states = lessonStates({
    lessons: items.map((x) => ({ id: x.lesson.id, prerequisites: x.lesson.prerequisites })),
    enabled: () => true,
    manuallyUnlocked: () => me.cls.unlockAll,
    status: (id) => me.progress[id]?.status as "in_progress" | "completed" | undefined,
  });
  return { items, states };
}
