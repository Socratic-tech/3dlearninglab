import { badges, competencies, domains, type Lesson, type Proficiency } from "@/content";
import { designerLevel, domainProgress, meetsLevel, rank } from "./mastery";
import type { LessonState } from "./progression";

type Levels = Map<string, { level: Proficiency }>;

export function pathCompetencyIds(curriculum: { lesson: Lesson }[]): Set<string> {
  const ids = new Set<string>();
  for (const c of curriculum) c.lesson.competencyIds.forEach((x) => ids.add(x));
  return ids;
}

export function summarize<T extends { lesson: Lesson; week: number }>(input: { curriculum: T[]; states: Map<string, LessonState> | null; levels: Levels; ownedBadges: Set<string> }) {
  const inPath = pathCompetencyIds(input.curriculum);
  const lv = (id: string) => input.levels.get(id)?.level ?? "not_attempted";
  const mastered = [...inPath].filter((id) => rank(lv(id)) >= 2).length;
  const current =
    input.curriculum.find((c) => input.states?.get(c.lesson.id) === "in_progress") ?? input.curriculum.find((c) => input.states?.get(c.lesson.id) === "available");
  const completedCount = input.curriculum.filter((c) => input.states?.get(c.lesson.id) === "completed").length;
  const domainBars = domains
    .map((d) => {
      const ids = competencies.filter((c) => c.domain === d.id && inPath.has(c.id)).map((c) => c.id);
      return { domain: d, value: domainProgress(ids.map(lv)), count: ids.length };
    })
    .filter((d) => d.count > 0);
  const nextBadge = badges
    .filter((b) => !input.ownedBadges.has(b.id))
    .map((b) => ({ badge: b, missing: b.requires.filter((c) => !meetsLevel(lv(c), b.minLevel)) }))
    .sort((a, b) => a.missing.length - b.missing.length)[0];
  return {
    designerLevel: designerLevel([...input.levels.values()].map((l) => l.level)),
    mastered,
    total: inPath.size,
    current,
    completedCount,
    domainBars,
    nextBadge,
  };
}
