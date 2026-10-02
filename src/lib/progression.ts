/**
 * Lesson availability (pure). A lesson is available when every prerequisite that is part of this course's
 * path (and enabled) has been completed, or the teacher manually unlocked it (e.g. Tinkercad unavailable).
 * Prerequisites outside the course path are ignored, so the 9-week course can skip lessons.
 * Completion — not proficiency — unlocks the next lesson (architecture decision AD6).
 */
export type LessonState = "locked" | "available" | "in_progress" | "completed";

export type ProgressionInput = {
  lessons: { id: string; prerequisites: string[] }[];
  enabled: (lessonId: string) => boolean;
  manuallyUnlocked: (lessonId: string) => boolean;
  status: (lessonId: string) => "not_started" | "in_progress" | "completed" | undefined;
};

export function lessonStates(input: ProgressionInput): Map<string, LessonState> {
  const inPath = new Set(input.lessons.filter((l) => input.enabled(l.id)).map((l) => l.id));
  const result = new Map<string, LessonState>();
  for (const l of input.lessons) {
    if (!input.enabled(l.id)) continue;
    const s = input.status(l.id);
    if (s === "completed") {
      result.set(l.id, "completed");
      continue;
    }
    const prereqsMet = l.prerequisites.filter((p) => inPath.has(p)).every((p) => input.status(p) === "completed");
    if (prereqsMet || input.manuallyUnlocked(l.id)) result.set(l.id, s === "in_progress" ? "in_progress" : "available");
    else result.set(l.id, "locked");
  }
  return result;
}

export function missingPrerequisites(input: ProgressionInput, lessonId: string): string[] {
  const l = input.lessons.find((x) => x.id === lessonId);
  if (!l) return [];
  const inPath = new Set(input.lessons.filter((x) => input.enabled(x.id)).map((x) => x.id));
  return l.prerequisites.filter((p) => inPath.has(p) && input.status(p) !== "completed");
}
