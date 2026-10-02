import { useSyncExternalStore } from "react";
import { getLocale, subscribeLocale, tr, type Locale } from "./i18n";

/** Current UI language; components re-render when it changes. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, () => "en");
}

/** `const t = useT(); t("Continue →")` */
export function useT() {
  const locale = useLocale();
  return (en: string, vars?: Record<string, string | number>) => tr(en, vars, locale);
}
