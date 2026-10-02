/**
 * Spanish (and future) content overlays. Lesson files live in ./es/lessons/<lessonId>.json,
 * the rest in ./es/*.json. Generated with `npm run i18n:check` (lists anything untranslated).
 */
import type { Overlay } from "@/lib/i18n-content";
import { extractStrings } from "@/lib/i18n-content";
import { competencyInputs, domains } from "../competencies";
import { pathInputs } from "../paths";
import { journalPrompts } from "../badges";
import { modelAssetInputs } from "../models";
import { FLAVOR } from "../flavor";

/** Everything outside lessons that students read: skills, domains, paths, journal prompts, model cards. */
export function courseData() {
  return {
    competencies: competencyInputs.map((c) => ({ id: c.id, title: c.title, canStatement: c.canStatement })),
    domains: domains.map((d) => ({ id: d.id, title: d.title, shortTitle: d.shortTitle })),
    paths: pathInputs.map((p) => ({ id: p.id, title: p.title, weeks: p.weeks.map((w) => ({ id: `w${w.week}`, title: w.title, focus: w.focus })) })),
    journalPrompts: journalPrompts.map((j) => ({ id: j.id, title: j.title, prompt: j.prompt })),
    models: modelAssetInputs.map((m) => ({ id: m.id, title: m.title, educationalPurpose: m.educationalPurpose })),
  };
}

/** Flavor as a plain tree with ids so it can be overlaid like lessons. */
export function flavorData() {
  return Object.entries(FLAVOR).map(([id, f]) => ({
    id,
    hook: f.hook,
    clients: Object.entries(f.clients ?? {}).map(([cid, c]) => ({ id: cid, ...c })),
    themes: Object.entries(f.themes ?? {}).map(([cid, list]) => ({ id: cid, options: list.map((t) => ({ id: t.label, ...t })) })),
  }));
}

export const sourceStrings = {
  course: () => extractStrings(courseData()),
  flavor: () => extractStrings({ flavor: flavorData() }),
};

export type Overlays = { lessons: Record<string, Overlay>; course: Overlay; flavor: Overlay; diagrams: Record<string, string> };
