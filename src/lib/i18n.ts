/**
 * Tiny i18n layer (no dependencies). English is the source language: UI strings are looked up by their
 * English text, so a missing translation simply shows English. Lesson content uses ID-based overlays
 * (see i18n-content.ts).
 */
export type Locale = "en" | "es";
export const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
];

const dictionaries: Partial<Record<Locale, Record<string, string>>> = {};
let current: Locale = "en";
const listeners = new Set<() => void>();

export function registerDictionary(locale: Locale, dict: Record<string, string>) {
  dictionaries[locale] = { ...(dictionaries[locale] ?? {}), ...dict };
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(l: Locale) {
  if (l === current) return;
  current = l;
  if (typeof document !== "undefined") document.documentElement.lang = l;
  listeners.forEach((f) => f());
}

export function subscribeLocale(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

let collector: Set<string> | null = null;
/** Run fn and return every string it passed to tr() (used by the translation checker). */
export function collectStrings(fn: () => void): string[] {
  collector = new Set();
  try { fn(); } finally { /* keep */ }
  const out = [...collector];
  collector = null;
  return out;
}

/** Translate an English UI string; `{name}` placeholders are filled from vars. */
export function tr(en: string, vars?: Record<string, string | number>, locale: Locale = current): string {
  if (collector && /[A-Za-z]/.test(en)) collector.add(en);
  const s = (locale !== "en" && dictionaries[locale]?.[en]) || en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Plural helper: tr(one) when n === 1, else tr(other). */
export function trn(n: number, one: string, other: string, vars?: Record<string, string | number>) {
  return tr(n === 1 ? one : other, { n, ...(vars ?? {}) });
}
