/**
 * Content translations as overlays: a flat map from a stable path to the translated string.
 *
 * Paths use ids where they exist so inserting a block doesn't break translations:
 *   title · sections.2.title · sections.2.blocks:predict.prompt · sections.2.blocks:predict.options:b.text
 *   sections.1.blocks:tinkercad.steps.0 · vocabulary.3.definition
 * Only keys in TEXT_KEYS are translated. Anything missing falls back to English.
 */
export type Overlay = Record<string, string>;

export const TEXT_KEYS = new Set([
  "title", "subtitle", "summary", "hook", "body", "text", "prompt", "requirements", "term", "definition", "explanation",
  "checklist", "steps", "sentenceStarters", "left", "right", "label", "feedback", "hint", "reveal", "revealTitle",
  "caption", "lookFors", "alt", "nickname", "clue", "cause", "fix", "questions", "unit",
  // flavor + course data
  "headline", "who", "message", "idea", "canStatement", "shortTitle", "focus", "educationalPurpose",
]);
const SKIP_SUBTREES = new Set(["teacher"]);

const seg = (key: string, item: unknown, i: number) =>
  item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" ? `${key}:${(item as { id: string }).id}` : `${key}.${i}`;

/** Every translatable string in `obj`, keyed by path. */
export function extractStrings(obj: unknown): Overlay {
  const out: Overlay = {};
  const walk = (v: unknown, path: string, key: string, textual: boolean) => {
    if (typeof v === "string") {
      if (textual && v.trim()) out[path] = v;
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, path ? `${path.slice(0, path.length - key.length)}${seg(key, item, i)}` : seg(key, item, i), key, textual));
      return;
    }
    if (v && typeof v === "object") {
      for (const [k, vv] of Object.entries(v)) {
        if (SKIP_SUBTREES.has(k)) continue;
        walk(vv, path ? `${path}.${k}` : k, k, TEXT_KEYS.has(k));
      }
    }
  };
  walk(obj, "", "", false);
  return out;
}

/** A deep copy of `obj` with overlay strings applied (structure, ids and numbers untouched). */
export function applyOverlay<T>(obj: T, overlay: Overlay | undefined): T {
  if (!overlay || !Object.keys(overlay).length) return obj;
  const walk = (v: unknown, path: string, key: string, textual: boolean): unknown => {
    if (typeof v === "string") return textual && overlay[path] !== undefined ? overlay[path] : v;
    if (Array.isArray(v)) return v.map((item, i) => walk(item, path ? `${path.slice(0, path.length - key.length)}${seg(key, item, i)}` : seg(key, item, i), key, textual));
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, vv] of Object.entries(v)) o[k] = SKIP_SUBTREES.has(k) ? vv : walk(vv, path ? `${path}.${k}` : k, k, TEXT_KEYS.has(k));
      return o;
    }
    return v;
  };
  return walk(obj, "", "", false) as T;
}

/** Overlay entries for one block, re-rooted so they apply to the block object itself. */
export function blockOverlay(overlay: Overlay | undefined, blockId: string): Overlay | undefined {
  if (!overlay) return undefined;
  const out: Overlay = {};
  const marker = `blocks:${blockId}.`;
  for (const [k, v] of Object.entries(overlay)) {
    const i = k.indexOf(marker);
    if (i >= 0) out[k.slice(i + marker.length)] = v;
  }
  return out;
}

/** Translate a single block given its lesson's overlay (used by Apps Script for feedback/explanations). */
export function localizeBlock<T extends { id: string }>(block: T, lessonOverlay: Overlay | undefined): T {
  return applyOverlay(block, blockOverlay(lessonOverlay, block.id));
}
