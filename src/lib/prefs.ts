export type UiPrefs = {
  theme: "system" | "light" | "dark";
  text: "normal" | "large" | "xlarge";
  readable: boolean;
  motion: "system" | "reduce";
};
export const PREFS_COOKIE = "ui_prefs";
export const DEFAULT_PREFS: UiPrefs = { theme: "system", text: "normal", readable: false, motion: "system" };

export function parsePrefs(raw: string | undefined): UiPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const v = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      theme: v.theme === "light" || v.theme === "dark" ? v.theme : "system",
      text: v.text === "large" || v.text === "xlarge" ? v.text : "normal",
      readable: v.readable === true,
      motion: v.motion === "reduce" ? "reduce" : "system",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}
