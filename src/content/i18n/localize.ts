/**
 * Locale-aware access to non-lesson content (flavor, skills, paths, diagrams, UI). All overlays are small,
 * so they're bundled; Spanish lessons are a separate generated file loaded on demand (see web/src/content.ts).
 */
import type { Locale } from "@/lib/i18n";
import { registerDictionary } from "@/lib/i18n";
import { applyOverlay, type Overlay } from "@/lib/i18n-content";
import { FLAVOR, type Flavor } from "../flavor";
import { courseData, flavorData } from "./index";
import esUi from "./es/ui.json";
import esDiagrams from "./es/diagrams.json";
import esFlavor from "./es/flavor.json";
import esCourse from "./es/course.json";

// UI strings and diagram labels are both looked up by their English text.
registerDictionary("es", { ...(esDiagrams as Record<string, string>), ...(esUi as Record<string, string>) });

const flavorCache: Partial<Record<Locale, Record<string, Flavor>>> = { en: FLAVOR };
export function localizedFlavor(lessonId: string, locale: Locale): Flavor | undefined {
  if (!flavorCache[locale]) {
    const tree = applyOverlay({ flavor: flavorData() }, esFlavor as Overlay).flavor;
    flavorCache[locale] = Object.fromEntries(
      tree.map((f) => [f.id, {
        hook: f.hook,
        clients: Object.fromEntries(f.clients.map(({ id, ...c }) => [id, c])),
        themes: Object.fromEntries(f.themes.map((t) => [t.id, t.options.map(({ label, idea }) => ({ label, idea }))])),
      }]),
    );
  }
  return flavorCache[locale]![lessonId];
}

type Course = ReturnType<typeof courseData>;
const courseCache: Partial<Record<Locale, Course>> = {};
/** Skills, domains, paths, journal prompts and model cards in the given language. */
export function localizedCourse(locale: Locale): Course {
  if (!courseCache[locale]) courseCache[locale] = locale === "en" ? courseData() : applyOverlay(courseData(), esCourse as Overlay);
  return courseCache[locale]!;
}
